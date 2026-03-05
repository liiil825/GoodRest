#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    run();
}

use std::fs;
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

use timer::{check_date_reset, TimerState, WorkMode};

/// 强制窗口置顶并全屏的跨平台函数
#[allow(unused_variables)]
fn force_overlay(window: &tauri::WebviewWindow) {
    // 基础 Tauri 置顶和全屏
    let _ = window.set_always_on_top(true);
    let _ = window.set_fullscreen(true);
    let _ = window.set_decorations(false); // 必须去掉边框才能真正"覆盖"

    // Windows 深度优化：取消任务栏占位
    #[cfg(target_os = "windows")]
    {
        let _ = window.set_skip_taskbar(true);
    }
}

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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
                    let work_mode = state.work_mode;
                    let next_reminder_at = state.next_reminder_at;
                    let interval_minutes = state.interval_minutes;
                    let rest_duration_seconds = state.rest_duration_seconds;
                    let big_tomato_rest_seconds = state.big_tomato_rest_seconds;
                    drop(state);

                    if let Some(target_time) = next_reminder_at {
                        let current = get_current_timestamp();
                        if current >= target_time {
                            let mut state = timer_state_clone.lock().await;

                            // Check date reset
                            check_date_reset(&mut state);

                            if state.work_mode == WorkMode::Working {
                                // Work ended, switch to rest mode
                                // Check if this is the 4th small tomato -> big rest
                                state.small_tomato_count += 1;
                                let is_big_rest = state.small_tomato_count >= 4;

                                if is_big_rest {
                                    state.work_mode = WorkMode::BigResting;
                                    state.big_tomato_count += 1;
                                    state.small_tomato_count = 0;
                                    state.next_reminder_at = Some(get_current_timestamp() + big_tomato_rest_seconds);
                                    println!("[Timer] Big rest started, emitting big-rest-started event");
                                    let _ = app_handle.emit("big-rest-started", ());
                                } else {
                                    state.work_mode = WorkMode::Resting;
                                    state.next_reminder_at = Some(get_current_timestamp() + rest_duration_seconds);
                                    println!("[Timer] Small rest started, emitting work-ended event");
                                    let _ = app_handle.emit("work-ended", ());
                                }

                                let _ = app_handle.emit("show-reminder", ());
                            } else {
                                // Rest ended (small or big), switch back to work mode
                                state.work_mode = WorkMode::Working;
                                state.next_reminder_at = Some(get_current_timestamp() + (interval_minutes * 60.0) as u64);

                                if work_mode == WorkMode::BigResting {
                                    println!("[Timer] Big rest ended, emitting rest-ended event");
                                    let _ = app_handle.emit("rest-ended", ());
                                } else {
                                    println!("[Timer] Small rest ended, emitting rest-ended event");
                                    let _ = app_handle.emit("rest-ended", ());
                                }
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
            get_next_reminder_seconds,
            set_rest_mode,
            set_work_mode,
            get_audio_base64,
            check_custom_audio_exists,
            // New commands for pomodoro
            set_big_tomato_rest_duration,
            get_big_tomato_rest_duration,
            get_tomato_counts,
            get_audio_base64_by_type,
            check_audio_exists
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
async fn set_big_tomato_rest_duration(
    seconds: u64,
    state: tauri::State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    let mut timer_state = state.lock().await;
    timer_state.big_tomato_rest_seconds = seconds;
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
async fn get_big_tomato_rest_duration(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<u64, String> {
    let timer_state = state.lock().await;
    Ok(timer_state.big_tomato_rest_seconds)
}

#[tauri::command]
async fn get_tomato_counts(state: tauri::State<'_, Arc<Mutex<TimerState>>>) -> Result<(u32, u32), String> {
    let timer_state = state.lock().await;
    // Check date reset first
    let mut state_mut = timer_state.clone();
    check_date_reset(&mut state_mut);
    Ok((timer_state.small_tomato_count, timer_state.big_tomato_count))
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
        WorkMode::BigResting => Ok("big_resting".to_string()),
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

#[tauri::command]
async fn set_rest_mode(app_handle: AppHandle) -> Result<(), String> {
    println!("[Rust] set_rest_mode called");

    // Get the main window by label
    let window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Failed to get main window".to_string())?;

    // Show and focus the window first
    window.show().map_err(|e| e.to_string())?;
    println!("[Rust] window.show() complete");
    window.unminimize().map_err(|e| e.to_string())?;
    println!("[Rust] window.unminimize() complete");
    window.set_focus().map_err(|e| e.to_string())?;
    println!("[Rust] window.set_focus() complete");

    // Force overlay - this handles fullscreen, always on top, decorations, and macOS window level
    force_overlay(&window);
    println!("[Rust] force_overlay complete");

    Ok(())
}

#[tauri::command]
async fn set_work_mode(app_handle: AppHandle) -> Result<(), String> {
    println!("[Rust] set_work_mode called");

    // Get the main window by label
    let window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Failed to get main window".to_string())?;

    // Exit fullscreen first (must be done before unmaximize)
    match window.set_fullscreen(false) {
        Ok(_) => println!("[Rust] window.set_fullscreen(false) complete"),
        Err(e) => println!("[Rust] window.set_fullscreen(false) failed: {}", e),
    }

    // Disable always on top
    match window.set_always_on_top(false) {
        Ok(_) => println!("[Rust] window.set_always_on_top(false) complete"),
        Err(e) => println!("[Rust] window.set_always_on_top(false) failed: {}", e),
    }

    // Restore decorations (show window border)
    match window.set_decorations(true) {
        Ok(_) => println!("[Rust] window.set_decorations(true) complete"),
        Err(e) => println!("[Rust] window.set_decorations(true) failed: {}", e),
    }

    // Unmaximize to restore normal window size
    match window.unmaximize() {
        Ok(_) => println!("[Rust] window.unmaximize() complete"),
        Err(e) => println!("[Rust] window.unmaximize() failed: {}", e),
    }

    Ok(())
}

/// Check if custom audio file exists (for backward compatibility)
#[tauri::command]
async fn check_custom_audio_exists(app: AppHandle) -> Result<bool, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let audio_path = app_dir.join("audio").join("rest.mp3");
    Ok(audio_path.exists())
}

/// Check if custom audio file exists by type (work, small_rest, big_rest)
#[tauri::command]
async fn check_audio_exists(app: AppHandle, audio_type: String) -> Result<bool, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let filename = match audio_type.as_str() {
        "work" => "work.mp3",
        "small_rest" => "small_rest.mp3",
        "big_rest" => "big_rest.mp3",
        _ => return Err("Invalid audio type".to_string()),
    };
    let audio_path = app_dir.join("audio").join(filename);
    Ok(audio_path.exists())
}

/// Get audio file as base64 for frontend playback (for backward compatibility)
#[tauri::command]
async fn get_audio_base64(app: AppHandle) -> Result<String, String> {
    get_audio_base64_by_type(app, "rest".to_string()).await
}

/// Get audio file as base64 by type for frontend playback
#[tauri::command]
async fn get_audio_base64_by_type(app: AppHandle, audio_type: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let filename = match audio_type.as_str() {
        "work" => "work.mp3",
        "small_rest" => "small_rest.mp3",
        "big_rest" => "big_rest.mp3",
        "rest" => "rest.mp3",  // backward compatibility
        _ => return Err("Invalid audio type".to_string()),
    };

    let audio_path = app_dir.join("audio").join(filename);

    if !audio_path.exists() {
        return Err("Audio file not found".to_string());
    }

    let data = fs::read(&audio_path).map_err(|e| format!("Failed to read audio file: {}", e))?;

    // Determine MIME type based on file extension
    let mime_type = match audio_path.extension().and_then(|s| s.to_str()) {
        Some("wav") => "audio/wav",
        Some("ogg") => "audio/ogg",
        Some("mp3") => "audio/mpeg",
        _ => "audio/mpeg", // 默认处理
    };

    // Encode to base64
    use std::io::Write;
    let mut encoder = base64::write::EncoderStringWriter::new(&base64::engine::general_purpose::STANDARD);
    encoder.write_all(&data).map_err(|e| format!("Base64 encode error: {}", e))?;
    let base64_data = encoder.into_inner();

    // Return data URL format
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}
