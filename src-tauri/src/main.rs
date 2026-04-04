// src-tauri/src/main.rs

// Commands
#[path = "mods/commands.rs"]
mod commands;
use commands::{execute_shell, get_current_dir, change_dir};

// SQLite
#[path = "mods/sqlite.rs"]
mod sqlite;
use sqlite::{add_user, get_users, delete_user};

// Hardinfo
use std::sync::Mutex;
use sysinfo::System;
#[path = "mods/hardinfo.rs"]
mod hardinfo;
use hardinfo::{AppState, get_hardware_info};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .invoke_handler(tauri::generate_handler![
            execute_shell,
            get_current_dir,
            change_dir,
            add_user,
            get_users,
            delete_user,
            get_hardware_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
