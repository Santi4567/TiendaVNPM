// src-tauri/src/database.rs
use sqlx::{MySql, Pool, mysql::MySqlPoolOptions};

pub async fn create_connection() -> Result<Pool<MySql>, sqlx::Error> {
    // Cambia "nombre_de_tu_base_datos" por el nombre real de tu BD
    let database_url = "mysql://root@localhost:3306/tienda";
    
    MySqlPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}

// Función para hashear contraseñas (útil para migrar contraseñas existentes)
pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
}