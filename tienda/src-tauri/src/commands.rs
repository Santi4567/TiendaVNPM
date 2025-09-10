// src-tauri/src/commands.rs
use crate::auth::AuthService;
use crate::models::{LoginRequest, LoginResponse, UserInfo};
use sqlx::{MySql, Pool};
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub auth_service: Arc<AuthService>,
}

#[tauri::command]
pub async fn login(
    request: LoginRequest,
    state: State<'_, AppState>
) -> Result<LoginResponse, String> {
    println!("Comando login ejecutado para: {}", request.username);
    state.auth_service.login(request).await
}

#[tauri::command]
pub async fn verify_token(
    token: String,
    state: State<'_, AppState>
) -> Result<bool, String> {
    println!("Verificando token...");
    match state.auth_service.verify_token(&token) {
        Ok(_) => {
            println!("Token válido");
            Ok(true)
        },
        Err(e) => {
            println!("Token inválido: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn get_user_from_token(
    token: String,
    state: State<'_, AppState>
) -> Result<Option<UserInfo>, String> {
    println!("Obteniendo usuario desde token...");
    match state.auth_service.verify_token(&token) {
        Ok(claims) => {
            println!("Usuario obtenido: {}", claims.username);
            Ok(Some(UserInfo {
                id: claims.sub,
                username: claims.username,
            }))
        },
        Err(e) => {
            println!("Error obteniendo usuario: {}", e);
            Ok(None)
        }
    }
}

#[tauri::command]
pub async fn test_connection(
    state: State<'_, AppState>
) -> Result<String, String> {
    // Comando para probar la conexión a la base de datos
    match sqlx::query("SELECT 1").fetch_optional(&*state.auth_service.db).await {
        Ok(_) => Ok("Conexión a base de datos exitosa".to_string()),
        Err(e) => Err(format!("Error de conexión: {}", e))
    }
}