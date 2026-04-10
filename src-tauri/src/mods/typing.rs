use serde::{Deserialize, Serialize};
use tauri::command;
use rusqlite::{Connection, Result as SqliteResult, params};
use std::sync::Mutex;
use tauri::path::BaseDirectory;
use tauri::Manager;

// 词汇集结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WordSet {
    pub id: i32,
    pub name: String,
    pub words: String,
    pub is_official: bool,
    pub created_at: String,
}

// 数据库状态
pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(conn: Connection) -> Self {
        DbState {
            conn: Mutex::new(conn),
        }
    }
}

// 初始化打字练习数据库
pub fn init_typing_database() -> Result<DbState, String> {
    let app_dir = get_app_data_dir();
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let db_path = app_dir.join("typing_practice.db");
    // 打印完整数据库路径
    println!("数据库路径: {}", db_path.display());

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    init_typing_table(&conn).map_err(|e| e.to_string())?;
    
    Ok(DbState::new(conn))
}

// 获取应用数据目录的辅助函数
fn get_app_data_dir() -> std::path::PathBuf {
    // 获取项目目录或当前目录
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            return parent.join("data");
        }
    }
    std::path::PathBuf::from(".")
}

// 初始化数据库表
pub fn init_typing_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS custom_word_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            words TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}

// 获取所有自定义词汇集
#[command]
pub async fn get_custom_word_sets(state: tauri::State<'_, DbState>) -> Result<Vec<WordSet>, String> {
    let conn = state.conn.lock().map_err(|e| format!("Failed to lock mutex: {}", e))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, words, created_at FROM custom_word_sets ORDER BY created_at DESC"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let word_sets = stmt
        .query_map([], |row| {
            Ok(WordSet {
                id: row.get(0)?,
                name: row.get(1)?,
                words: row.get(2)?,
                is_official: false,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("Failed to query: {}", e))?
        .collect::<SqliteResult<Vec<WordSet>>>()
        .map_err(|e| format!("Failed to collect results: {}", e))?;
    
    Ok(word_sets)
}

// 保存自定义词汇集
#[command]
pub async fn save_custom_word_set(
    state: tauri::State<'_, DbState>,
    name: String,
    words: String,
) -> Result<WordSet, String> {
    if name.trim().is_empty() {
        return Err("词汇集名称不能为空".to_string());
    }
    println!("保存词汇集 - 名称: {}, 单词: {}", name, words);
    
    // 验证 JSON 格式
    let words_array: Vec<String> = serde_json::from_str(&words)
        .map_err(|e| format!("无效的单词格式: {}", e))?;
    
    if words_array.is_empty() {
        return Err("至少需要一个单词".to_string());
    }
    
    let created_at = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    let conn = state.conn.lock().map_err(|e| format!("Failed to lock mutex: {}", e))?;
    
    conn.execute(
        "INSERT INTO custom_word_sets (name, words, created_at) VALUES (?1, ?2, ?3)",
        params![name, words, created_at],
    ).map_err(|e| format!("Failed to insert: {}", e))?;
    
    let id = conn.last_insert_rowid() as i32;
    
    Ok(WordSet {
        id,
        name,
        words,
        is_official: false,
        created_at,
    })
}

// 删除自定义词汇集
#[command]
pub async fn delete_custom_word_set(
    state: tauri::State<'_, DbState>,
    id: i32,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| format!("Failed to lock mutex: {}", e))?;
    
    let affected = conn.execute(
        "DELETE FROM custom_word_sets WHERE id = ?1",
        params![id],
    ).map_err(|e| format!("Failed to delete: {}", e))?;
    
    if affected == 0 {
        return Err("未找到指定的词汇集".to_string());
    }
    
    Ok(())
}

// 更新自定义词汇集
#[command]
pub async fn update_custom_word_set(
    state: tauri::State<'_, DbState>,
    id: i32,
    name: String,
    words: String,
) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("词汇集名称不能为空".to_string());
    }
    
    let words_array: Vec<String> = serde_json::from_str(&words)
        .map_err(|e| format!("无效的单词格式: {}", e))?;
    
    if words_array.is_empty() {
        return Err("至少需要一个单词".to_string());
    }
    
    let conn = state.conn.lock().map_err(|e| format!("Failed to lock mutex: {}", e))?;
    
    let affected = conn.execute(
        "UPDATE custom_word_sets SET name = ?1, words = ?2 WHERE id = ?3",
        params![name, words, id],
    ).map_err(|e| format!("Failed to update: {}", e))?;
    
    if affected == 0 {
        return Err("未找到指定的词汇集".to_string());
    }
    
    Ok(())
}

// 获取单个自定义词汇集
#[command]
pub async fn get_custom_word_set(
    state: tauri::State<'_, DbState>,
    id: i32,
) -> Result<Option<WordSet>, String> {
    let conn = state.conn.lock().map_err(|e| format!("Failed to lock mutex: {}", e))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, words, created_at FROM custom_word_sets WHERE id = ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    match stmt.query_row(params![id], |row| {
        Ok(WordSet {
            id: row.get(0)?,
            name: row.get(1)?,
            words: row.get(2)?,
            is_official: false,
            created_at: row.get(3)?,
        })
    }) {
        Ok(word_set) => Ok(Some(word_set)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to query: {}", e)),
    }
}