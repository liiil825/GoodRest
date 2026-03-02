#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    run();
}

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, RunEvent,
};
use tokio::sync::Mutex;
use tokio::time::interval;

mod timer;

use timer::TimerState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_state = Arc::new(Mutex::new(TimerState::default()));
    let is_paused = Arc::new(AtomicBool::new(false));

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
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Start timer task
            let app_handle = app.handle().clone();
            let timer_state_clone = timer_state.clone();
            let is_paused_clone = is_paused.clone();

            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_secs(60));
                let mut elapsed_minutes: u64 = 0;
                let mut last_reminder_elapsed: u64 = 0;

                loop {
                    ticker.tick().await;

                    if is_paused_clone.load(Ordering::SeqCst) {
                        continue;
                    }

                    let state = timer_state_clone.lock().await;
                    let interval_minutes = state.interval_minutes;
                    drop(state);

                    elapsed_minutes += 1;

                    // Check if it's time for a reminder
                    if elapsed_minutes > 0
                        && elapsed_minutes % interval_minutes == 0
                        && elapsed_minutes != last_reminder_elapsed
                    {
                        last_reminder_elapsed = elapsed_minutes;
                        let _ = app_handle.emit("show-reminder", ());
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_interval,
            get_interval,
            skip_reminder,
            snooze_reminder,
            is_timer_paused
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
    minutes: u64,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    let mut timer_state = state.lock().await;
    timer_state.interval_minutes = minutes;
    Ok(())
}

#[tauri::command]
async fn get_interval(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<u64, String> {
    let timer_state = state.lock().await;
    Ok(timer_state.interval_minutes)
}

#[tauri::command]
async fn skip_reminder(app: AppHandle) -> Result<(), String> {
    // Reset the timer by emitting a skipped event
    let _ = app.emit("reminder-skipped", ());
    Ok(())
}

#[tauri::command]
async fn snooze_reminder(app: AppHandle, minutes: u64) -> Result<(), String> {
    // Emit snooze event with duration
    let _ = app.emit("reminder-snoozed", minutes);
    Ok(())
}

#[tauri::command]
async fn is_timer_paused(is_paused: tauri::State<'_, Arc<AtomicBool>>) -> Result<bool, String> {
    Ok(is_paused.load(Ordering::SeqCst))
}
