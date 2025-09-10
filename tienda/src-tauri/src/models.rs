use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// src-tauri/src/models.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    #[sqlx(rename = "ID")]
    pub id: i32,
    #[sqlx(rename = "User")]
    pub user: String,
    #[sqlx(rename = "Passwd")]
    pub passwd: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user: Option<UserInfo>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: i32,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,        // ID del usuario
    pub username: String, // Nombre de usuario
    pub exp: usize,      // Tiempo de expiración
    pub iat: usize,      // Issued at
}