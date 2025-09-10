// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod models;
mod auth;
mod database;
mod commands;

use auth::AuthService;
use commands::{AppState, login, verify_token, get_user_from_token, test_connection};
use database::create_connection;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    println!("Iniciando aplicación Tauri...");

    // Crear conexión a la base de datos
    let db_pool = match create_connection().await {
        Ok(pool) => {
            println!("Conexión a base de datos exitosa");
            pool
        },
        Err(e) => {
            eprintln!("Error conectando a la base de datos: {}", e);
            eprintln!("Asegúrate de que:");
            eprintln!("1. MySQL esté ejecutándose");
            eprintln!("2. La base de datos exista");
            eprintln!("3. Las credenciales en database.rs sean correctas");
            panic!("No se pudo conectar a la base de datos");
        }
    };

    // Crear servicio de autenticación
    let auth_service = Arc::new(AuthService::new(db_pool));

    // Estado de la aplicación
    let app_state = AppState { auth_service };

    println!("Registrando comandos Tauri...");

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            login,
            verify_token,
            get_user_from_token,
            test_connection
        ])
        .run(tauri::generate_context!())
        .expect("Error ejecutando la aplicación Tauri");
}