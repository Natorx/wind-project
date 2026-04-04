// src/sqlite.rs
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::env;

// 定义数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub age: i32,
}

// 初始化数据库
pub fn init_db() -> Result<Connection> {
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
pub fn add_user(name: String, age: i32) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (name, age) VALUES (?, ?)",
        [name, age.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_users() -> Result<Vec<User>, String> {
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
pub fn delete_user(id: i32) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM users WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}