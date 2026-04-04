// src/module/hardinfo.rs
use sysinfo::{System, Cpu};
use std::sync::Mutex;
use tauri::State;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub cpu_usage: f32,
    pub cpu_frequency: u64,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_free: u64,
}

pub struct AppState {
    pub sys: Mutex<System>,
}

#[tauri::command]
pub fn get_hardware_info(state: State<AppState>) -> HardwareInfo {
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