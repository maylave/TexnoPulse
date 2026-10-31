use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use tauri::Manager;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[allow(dead_code)]
const CREATE_NO_WINDOW: u32 = 0x08000000;
#[allow(dead_code)]
const DETACHED_PROCESS: u32 = 0x00000008;

const ICON_BYTES: &[u8] = include_bytes!("../icons/icon.ico");
const SERVER_BYTES: &[u8] = include_bytes!("../binaries/snapi-server-x86_64-pc-windows-msvc.exe");

fn get_saved_port() -> u16 {
    if let Ok(app_data) = std::env::var("APPDATA") {
        let port_path = Path::new(&app_data).join("Snapi").join("port.json");
        if let Ok(data) = std::fs::read_to_string(&port_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&data) {
                if let Some(port) = json.get("port").and_then(|p| p.as_u64()) {
                    return port as u16;
                }
            }
        }
    }
    3000
}

fn is_server_running_on_port(port: u16) -> bool {
    let addr: SocketAddr = match format!("127.0.0.1:{}", port).parse() {
        Ok(a) => a,
        Err(_) => return false,
    };
    TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
}

fn find_active_server_port() -> Option<u16> {
    let saved = get_saved_port();
    if is_server_running_on_port(saved) {
        return Some(saved);
    }
    for p in 3000..=3025 {
        if is_server_running_on_port(p) {
            return Some(p);
        }
    }
    None
}

fn find_server_binary() -> Option<PathBuf> {
    let current_exe = std::env::current_exe().ok()?;
    let exe_dir = current_exe.parent()?;

    let candidates = [
        exe_dir.join("snapi-server.exe"),
        exe_dir.join("snapi-server-x86_64-pc-windows-msvc.exe"),
        exe_dir.join("server.exe"),
        exe_dir.join("binaries/snapi-server-x86_64-pc-windows-msvc.exe"),
        exe_dir.join("../../../src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe"),
        exe_dir.join("../../src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe"),
    ];

    for path in &candidates {
        if path.exists() {
            println!(">>> Found backend server binary at: {:?}", path);
            return Some(path.clone());
        }
    }

    println!(">>> Backend server binary NOT found in candidates: {:?}", candidates);
    None
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_server_port() -> serde_json::Value {
    let port = find_active_server_port().unwrap_or_else(|| get_saved_port());
    serde_json::json!({
        "port": port,
        "wsUrl": format!("ws://127.0.0.1:{}", port),
        "httpUrl": format!("http://127.0.0.1:{}", port)
    })
}

#[tauri::command]
fn get_cli_notification() -> Option<serde_json::Value> {
    let args: Vec<String> = std::env::args().collect();
    if !args.iter().any(|arg| arg == "--notification" || arg == "--notify") {
        return None;
    }
    let title = args.iter()
        .find(|a| a.starts_with("--title="))
        .and_then(|a| a.strip_prefix("--title="))
        .unwrap_or("Snapi");
    let body = args.iter()
        .find(|a| a.starts_with("--body="))
        .and_then(|a| a.strip_prefix("--body="))
        .unwrap_or("");
    let n_type = args.iter()
        .find(|a| a.starts_with("--type="))
        .and_then(|a| a.strip_prefix("--type="))
        .unwrap_or("info");

    Some(serde_json::json!({
        "title": title,
        "body": body,
        "type": n_type,
        "isCliNotificationOnly": true
    }))
}

#[tauri::command]
fn check_port_available(port: u16) -> bool {
    std::net::TcpListener::bind(("127.0.0.1", port)).is_ok()
}

#[tauri::command]
fn get_default_install_dir() -> String {
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        Path::new(&local_app_data)
            .join("Programs")
            .join("Snapi")
            .to_string_lossy()
            .to_string()
    } else {
        "C:\\Program Files\\Snapi".to_string()
    }
}

#[tauri::command]
fn perform_installation(
    install_dir: String,
    create_desktop_shortcut: bool,
    create_start_menu_shortcut: bool,
    server_port: Option<u16>,
) -> Result<String, String> {
    let target_dir = Path::new(&install_dir);
    std::fs::create_dir_all(target_dir).map_err(|e| format!("Не удалось создать директорию: {}", e))?;

    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let _exe_dir = current_exe.parent().unwrap_or(Path::new("."));

    // 1. Копируем snapi-app.exe
    let dest_app = target_dir.join("snapi-app.exe");
    let _ = std::fs::copy(&current_exe, &dest_app);

    // 2. Копируем snapi-server.exe
    let dest_server = target_dir.join("snapi-server.exe");
    if let Some(server_bin) = find_server_binary() {
        let _ = std::fs::copy(&server_bin, &dest_server);
    } else {
        let _ = std::fs::write(&dest_server, SERVER_BYTES);
    }

    // 3. Копируем icon.ico
    let dest_icon = target_dir.join("icon.ico");
    let _ = std::fs::write(&dest_icon, ICON_BYTES);

    // 3.5. Сохраняем выбранный порт в конфигурацию
    if let Some(port) = server_port {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        let json = serde_json::json!({
            "port": port,
            "preferredPort": port,
            "wsUrl": format!("ws://127.0.0.1:{}", port),
            "httpUrl": format!("http://127.0.0.1:{}", port),
            "timestamp": now
        });
        let content = serde_json::to_string_pretty(&json).unwrap_or_default();

        if let Ok(app_data) = std::env::var("APPDATA") {
            let snapi_dir = Path::new(&app_data).join("Snapi");
            let _ = std::fs::create_dir_all(&snapi_dir);
            let _ = std::fs::write(snapi_dir.join("port.json"), &content);
        }
        let _ = std::fs::write(target_dir.join(".port.json"), &content);
    }

    // 4. Создаем ярлык на рабочем столе с icon.ico
    if create_desktop_shortcut {
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let lnk_path = Path::new(&user_profile).join("Desktop").join("Snapi.lnk");
            let script = format!(
                "$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('{}');$s.TargetPath='{}';$s.IconLocation='{},0';$s.Save();",
                lnk_path.to_string_lossy().replace("'", "''"),
                dest_app.to_string_lossy().replace("'", "''"),
                dest_icon.to_string_lossy().replace("'", "''")
            );
            let mut cmd = Command::new("powershell");
            cmd.args(["-NoProfile", "-Command", &script]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.status();
        }
    }

    // 5. Создаем ярлык в меню Пуск
    if create_start_menu_shortcut {
        if let Ok(app_data) = std::env::var("APPDATA") {
            let start_menu_dir = Path::new(&app_data).join("Microsoft").join("Windows").join("Start Menu").join("Programs");
            let lnk_path = start_menu_dir.join("Snapi.lnk");
            let script = format!(
                "$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('{}');$s.TargetPath='{}';$s.IconLocation='{},0';$s.Save();",
                lnk_path.to_string_lossy().replace("'", "''"),
                dest_app.to_string_lossy().replace("'", "''"),
                dest_icon.to_string_lossy().replace("'", "''")
            );
            let mut cmd = Command::new("powershell");
            cmd.args(["-NoProfile", "-Command", &script]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.status();
        }
    }

    // 6. Регистрация в реестре Windows Uninstall (Программы и компоненты)
    let reg_script = format!(
        "$key = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Snapi';\
         New-Item -Path $key -Force | Out-Null;\
         Set-ItemProperty -Path $key -Name 'DisplayName' -Value 'Snapi Messenger';\
         Set-ItemProperty -Path $key -Name 'DisplayVersion' -Value '0.0.5';\
         Set-ItemProperty -Path $key -Name 'Publisher' -Value 'Mi';\
         Set-ItemProperty -Path $key -Name 'DisplayIcon' -Value '{}';\
         Set-ItemProperty -Path $key -Name 'InstallLocation' -Value '{}';",
        dest_icon.to_string_lossy().replace("'", "''"),
        target_dir.to_string_lossy().replace("'", "''")
    );
    let mut reg_cmd = Command::new("powershell");
    reg_cmd.args(["-NoProfile", "-Command", &reg_script]);
    #[cfg(windows)]
    reg_cmd.creation_flags(CREATE_NO_WINDOW);
    let _ = reg_cmd.status();

    Ok(install_dir)
}

#[tauri::command]
fn launch_installed_app(install_dir: String) -> Result<(), String> {
    let app_exe = Path::new(&install_dir).join("snapi-app.exe");
    if app_exe.exists() {
        let mut cmd = Command::new(&app_exe);
        #[cfg(windows)]
        cmd.creation_flags(DETACHED_PROCESS);
        cmd.spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!(">>> Tauri run() started!");

    let args: Vec<String> = std::env::args().collect();
    let current_exe = std::env::current_exe().unwrap_or_default();
    let exe_name = current_exe.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
    let is_installer = args.iter().any(|arg| arg == "--installer" || arg == "--setup")
        || exe_name.contains("setup")
        || exe_name.contains("installer");

    // Для установщика используем изолированный временный профиль WebView2,
    // чтобы исключить ошибку HRESULT 0x800700AA (Требуемый ресурс занят)
    if is_installer {
        if let Ok(temp) = std::env::var("TEMP") {
            let pid = std::process::id();
            let installer_data = Path::new(&temp).join(format!("snapi_installer_wv2_{}", pid));
            unsafe {
                std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", installer_data);
            }
        }
    }

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_cli_notification,
            get_server_port,
            check_port_available,
            get_default_install_dir,
            perform_installation,
            launch_installed_app
        ])
        .setup(|app| {
            println!(">>> Setup hook started!");

            let args: Vec<String> = std::env::args().collect();
            let current_exe = std::env::current_exe().unwrap_or_default();
            let exe_name = current_exe.file_name().unwrap_or_default().to_string_lossy().to_lowercase();

            let is_notification_only = args.iter().any(|arg| arg == "--notification" || arg == "--notify");
            let is_installer = args.iter().any(|arg| arg == "--installer" || arg == "--setup")
                || exe_name.contains("setup")
                || exe_name.contains("installer");

            if is_installer {
                println!(">>> Mode: Custom Installer.");
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.hide();
                }
                if let Some(notif_win) = app.get_webview_window("notification") {
                    let _ = notif_win.hide();
                }
                if let Some(inst_win) = app.get_webview_window("installer") {
                    let _ = inst_win.center();
                    let _ = inst_win.show();
                    let _ = inst_win.unminimize();
                    let _ = inst_win.set_focus();
                }
                return Ok(());
            }

            // 1. Проверяем, запущен ли уже бэкенд на каком-либо порту (3000..3025)
            if let Some(active_port) = find_active_server_port() {
                println!(">>> Backend server is ALREADY RUNNING on 127.0.0.1:{}, skipping launch.", active_port);
            } else {
                if let Some(bin_path) = find_server_binary() {
                    println!(">>> Launching detached background backend server: {:?}", bin_path);
                    let work_dir = bin_path.parent().unwrap_or(Path::new("."));
                    let mut cmd = Command::new(&bin_path);
                    cmd.current_dir(work_dir);

                    #[cfg(windows)]
                    cmd.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS);

                    match cmd.spawn() {
                        Ok(child) => {
                            println!(">>> Backend server spawned independently with PID: {}", child.id());
                            for _ in 0..40 {
                                if let Some(p) = find_active_server_port() {
                                    println!(">>> Backend server is READY on port {}!", p);
                                    break;
                                }
                                std::thread::sleep(Duration::from_millis(100));
                            }
                        }
                        Err(e) => {
                            eprintln!(">>> Failed to spawn backend server: {:?}", e);
                        }
                    }
                }
            }

            // 2. Обработка обычного запуска или режима уведомления
            if is_notification_only {
                println!(">>> Mode: Notification ONLY. Keeping main window hidden.");
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.hide();
                }
                if let Some(notif_win) = app.get_webview_window("notification") {
                    let _ = notif_win.set_skip_taskbar(true);
                    let _ = notif_win.set_always_on_top(true);
                    let _ = notif_win.show();
                }
            } else {
                println!(">>> Mode: Normal. Showing main window.");
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.show();
                    let _ = main_win.set_focus();
                    let _ = main_win.unminimize();
                }
                if let Some(notif_win) = app.get_webview_window("notification") {
                    let _ = notif_win.set_skip_taskbar(true);
                    let _ = notif_win.hide();
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, _event| {
        // Бэкенд продолжает работать в фоне автономно даже при закрытии окна
    });
}
