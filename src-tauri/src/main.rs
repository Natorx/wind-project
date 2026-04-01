// src-tauri/src/main.rs
// Print server and Commands
use encoding_rs::GBK;
use std::{env, process::Command};

// 解码工具函数（消除重复代码）
fn decode_output(bytes: &[u8]) -> String {
    #[cfg(target_os = "windows")]
    {
        let (cow, _, had_errors) = GBK.decode(bytes);
        if had_errors {
            String::from_utf8_lossy(bytes).to_string()
        } else {
            cow.to_string()
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        String::from_utf8_lossy(bytes).to_string()
    }
}

// 执行命令通用函数
fn execute_command(shell: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(shell)
        .args(args)
        .output()
        .map_err(|e| format!("命令执行失败: {}", e))?;

    if output.status.success() {
        let stdout = decode_output(&output.stdout);
        Ok(stdout.trim().to_string())
    } else {
        let stderr = decode_output(&output.stderr);
        Err(format!("命令执行错误: {}", stderr.trim()))
    }
}

// 跨平台执行shell命令
#[tauri::command]
async fn execute_shell(cmd: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let (shell, arg) = ("cmd", "/C");
    #[cfg(not(target_os = "windows"))]
    let (shell, arg) = ("bash", "-c");

    execute_command(shell, &[arg, &cmd])
}

// 获取当前工作目录
#[tauri::command]
async fn get_current_dir() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let (shell, cmd) = ("cmd", "cd");
    #[cfg(not(target_os = "windows"))]
    let (shell, cmd) = ("bash", "pwd");

    execute_command(shell, &["-c", cmd])
}

// 切换目录
#[tauri::command]
async fn change_dir(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let cmd = format!("cd /d \"{}\" && cd", path);
    #[cfg(not(target_os = "windows"))]
    let cmd = format!("cd \"{}\" && pwd", path);

    execute_shell(cmd).await
}

// SQLite
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

// 定义数据结构
#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i32,
    name: String,
    age: i32,
}
// 初始化数据库（只运行一次）
fn init_db() -> Result<Connection> {
     // 使用临时目录，避免Tauri监控重启
    let mut db_path = env::temp_dir();
    db_path.push("red-wind-project.db");
    let conn = Connection::open(db_path)?;
    // 创建表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
fn add_user(name: String, age: i32) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (name, age) VALUES (?, ?)",
        [name, age.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_users() -> Result<Vec<User>, String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, age FROM users")
        .map_err(|e| e.to_string())?;

    let users_iter = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                age: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut users = Vec::new();
    for user in users_iter {
        users.push(user.map_err(|e| e.to_string())?);
    }

    Ok(users)
}

#[tauri::command]
fn delete_user(id: i32) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM users WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
// Hardinfo
use sysinfo::{System, Cpu};
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Clone)]
struct HardwareInfo {
    cpu_name: String,
    cpu_cores: usize,
    cpu_usage: f32,
    cpu_frequency: u64,
    memory_total: u64,
    memory_used: u64,
    memory_free: u64,
}

struct AppState {
    sys: Mutex<System>,
}

#[tauri::command]
fn get_hardware_info(state: State<AppState>) -> HardwareInfo {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_all();
    
    let cpus: &[Cpu] = sys.cpus();
    let cpu_info = if let Some(cpu) = cpus.first() {
        (
            cpu.name().to_string(),
            cpus.len(),
            cpus.iter().map(|c| c.cpu_usage()).sum::<f32>() / cpus.len() as f32,
            cpu.frequency(),
        )
    } else {
        ("Unknown".to_string(), 0, 0.0, 0)
    };
    
    HardwareInfo {
        cpu_name: cpu_info.0,
        cpu_cores: cpu_info.1,
        cpu_usage: cpu_info.2,
        cpu_frequency: cpu_info.3,
        memory_total: sys.total_memory(),
        memory_used: sys.used_memory(),
        memory_free: sys.free_memory(),
    }
}


// DrillGround
#[tauri::command]
async fn get_poem() -> Result<String, String> {
    // 模拟异步操作，比如从文件或网络获取
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    let poem = r#"
    春江潮水连海平，海上明月共潮生。
    滟滟随波千万里，何处春江无月明！
    "#
    .trim()
    .to_string();

    Ok(poem)
}

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
            get_poem,
            add_user,
            get_users,
            delete_user,
            get_hardware_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
