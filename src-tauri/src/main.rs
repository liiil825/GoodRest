#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    run();
}

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, RunEvent,
};
use tokio::sync::Mutex;
use tokio::time::interval;

mod timer;

use timer::{TimerState, WorkMode};

fn get_current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_state = Arc::new(Mutex::new(TimerState::default()));
    let is_paused = Arc::new(AtomicBool::new(false));

    // Initialize next_reminder_at
    {
        let mut state = timer_state.blocking_lock();
        state.next_reminder_at = Some(get_current_timestamp() + (state.interval_minutes * 60.0) as u64);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(timer_state.clone())
        .manage(is_paused.clone())
        .setup(move |app| {
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "暂停提醒", true, None::<&str>)?;
            let resume = MenuItem::with_id(app, "resume", "恢复提醒", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &pause, &resume, &quit])?;

            let is_paused_clone = is_paused.clone();

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "pause" => {
                        is_paused_clone.store(true, Ordering::SeqCst);
                        let _ = app.emit("timer-paused", ());
                    }
                    "resume" => {
                        is_paused_clone.store(false, Ordering::SeqCst);
                        let _ = app.emit("timer-resumed", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Handle window close event - minimize instead of quit
            let app_handle = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(win) = app_handle.get_webview_window("main") {
                            let _ = win.minimize();
                        }
                    }
                });
            }

            // Start timer task
            let app_handle = app.handle().clone();
            let timer_state_clone = timer_state.clone();
            let is_paused_clone = is_paused.clone();

            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_secs(1));

                loop {
                    ticker.tick().await;

                    if is_paused_clone.load(Ordering::SeqCst) {
                        continue;
                    }

                    let state = timer_state_clone.lock().await;
                    let _work_mode = state.work_mode;
                    let next_reminder_at = state.next_reminder_at;
                    let interval_minutes = state.interval_minutes;
                    let rest_duration_seconds = state.rest_duration_seconds;
                    drop(state);

                    if let Some(target_time) = next_reminder_at {
                        let current = get_current_timestamp();
                        if current >= target_time {
                            let mut state = timer_state_clone.lock().await;

                            if state.work_mode == WorkMode::Working {
                                // Work ended, switch to rest mode
                                state.work_mode = WorkMode::Resting;
                                state.next_reminder_at = Some(get_current_timestamp() + rest_duration_seconds);
                                let _ = app_handle.emit("work-ended", ());

                                // Also emit show-reminder for backward compatibility
                                let _ = app_handle.emit("show-reminder", ());
                            } else {
                                // Rest ended, switch back to work mode
                                state.work_mode = WorkMode::Working;
                                state.next_reminder_at = Some(get_current_timestamp() + (interval_minutes * 60.0) as u64);
                                let _ = app_handle.emit("rest-ended", ());
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_interval,
            get_interval,
            set_rest_duration,
            get_rest_duration,
            get_work_mode,
            skip_reminder,
            snooze_reminder,
            is_timer_paused,
            get_next_reminder_seconds
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}

#[tauri::command]
async fn set_interval(
    minutes: f64,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    let mut timer_state = state.lock().await;
    timer_state.interval_minutes = minutes;
    // Only update next reminder if in working mode
    if timer_state.work_mode == WorkMode::Working {
        timer_state.next_reminder_at = Some(get_current_timestamp() + (minutes * 60.0) as u64);
    }
    Ok(())
}

#[tauri::command]
async fn set_rest_duration(
    seconds: u64,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    let mut timer_state = state.lock().await;
    timer_state.rest_duration_seconds = seconds;
    Ok(())
}

#[tauri::command]
async fn get_interval(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<f64, String> {
    let timer_state = state.lock().await;
    Ok(timer_state.interval_minutes)
}

#[tauri::command]
async fn get_rest_duration(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<u64, String> {
    let timer_state = state.lock().await;
    Ok(timer_state.rest_duration_seconds)
}

#[tauri::command]
async fn get_next_reminder_seconds(
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
    is_paused: tauri::State<'_, Arc<AtomicBool>>,
) -> Result<Option<u64>, String> {
    if is_paused.load(Ordering::SeqCst) {
        return Ok(None);
    }

    let timer_state = state.lock().await;
    if let Some(next_reminder_at) = timer_state.next_reminder_at {
        let current = get_current_timestamp();
        if next_reminder_at > current {
            Ok(Some(next_reminder_at - current))
        } else {
            Ok(Some(0))
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn get_work_mode(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<String, String> {
    let timer_state = state.lock().await;
    match timer_state.work_mode {
        WorkMode::Working => Ok("working".to_string()),
        WorkMode::Resting => Ok("resting".to_string()),
    }
}

#[tauri::command]
async fn skip_reminder(
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    // Reset the timer by emitting a skipped event
    let _ = app.emit("reminder-skipped", ());

    // Reset timer: switch back to working mode
    let mut timer_state = state.lock().await;
    timer_state.work_mode = WorkMode::Working;
    timer_state.next_reminder_at = Some(get_current_timestamp() + (timer_state.interval_minutes * 60.0) as u64);
    Ok(())
}

#[tauri::command]
async fn snooze_reminder(
    app: AppHandle,
    minutes: u64,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    // Emit snooze event with duration
    let _ = app.emit("reminder-snoozed", minutes);

    // Reset timer: switch back to working mode
    let mut timer_state = state.lock().await;
    timer_state.work_mode = WorkMode::Working;
    timer_state.next_reminder_at = Some(get_current_timestamp() + minutes * 60);
    Ok(())
}

#[tauri::command]
async fn is_timer_paused(is_paused: tauri::State<'_, Arc<AtomicBool>>) -> Result<bool, String> {
    Ok(is_paused.load(Ordering::SeqCst))
}
