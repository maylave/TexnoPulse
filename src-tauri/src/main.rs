// Prevents console window on Windows in ALL builds (debug & release)
#![windows_subsystem = "windows"]

fn main() {
    snapi_app_lib::run()
}
