// src-tauri/src/auth.rs
use crate::models::{User, LoginRequest, LoginResponse, UserInfo, Claims};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use sqlx::{MySql, Pool};
use bcrypt::verify;

// IMPORTANTE: Cambia esta clave en producción
const JWT_SECRET: &str = "tu_clave_secreta_super_segura_cambiala_en_produccion";

pub struct AuthService {
    db: Pool<MySql>,
}

impl AuthService {
    pub fn new(db: Pool<MySql>) -> Self {
        Self { db }
    }

    pub async fn login(&self, request: LoginRequest) -> Result<LoginResponse, String> {
        println!("Intentando login para usuario: {}", request.username);
        
        // Buscar usuario en la base de datos
        let user_result = sqlx::query_as::<_, User>(
            "SELECT ID, User, Passwd FROM users WHERE User = ?"
        )
        .bind(&request.username)
        .fetch_optional(&self.db)
        .await;

        let user = match user_result {
            Ok(Some(user)) => {
                println!("Usuario encontrado: {}", user.user);
                user
            },
            Ok(None) => {
                println!("Usuario no encontrado: {}", request.username);
                return Ok(LoginResponse {
                    success: false,
                    token: None,
                    user: None,
                    message: "Usuario no encontrado".to_string(),
                });
            }
            Err(e) => {
                println!("Error de base de datos: {}", e);
                return Err(format!("Error de base de datos: {}", e));
            }
        };

        // Verificar contraseña
        let password_valid = if user.passwd.starts_with("$2") {
            // Si la contraseña ya está hasheada con bcrypt
            verify(&request.password, &user.passwd).unwrap_or(false)
        } else {
            // Si la contraseña está en texto plano (no recomendado pero común)
            user.passwd == request.password
        };

        if !password_valid {
            println!("Contraseña incorrecta para usuario: {}", user.user);
            return Ok(LoginResponse {
                success: false,
                token: None,
                user: None,
                message: "Contraseña incorrecta".to_string(),
            });
        }

        // Generar token JWT
        let token = self.generate_token(user.id, &user.user)?;
        
        println!("Login exitoso para usuario: {}", user.user);

        Ok(LoginResponse {
            success: true,
            token: Some(token),
            user: Some(UserInfo {
                id: user.id,
                username: user.user,
            }),
            message: "Login exitoso".to_string(),
        })
    }

    fn generate_token(&self, user_id: i32, username: &str) -> Result<String, String> {
        let now = Utc::now();
        let expire_time = now + Duration::hours(24); // Token válido por 24 horas

        let claims = Claims {
            sub: user_id,
            username: username.to_string(),
            exp: expire_time.timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(JWT_SECRET.as_ref())
        )
        .map_err(|e| format!("Error generando token: {}", e))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, String> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(JWT_SECRET.as_ref()),
            &Validation::default()
        )
        .map(|data| data.claims)
        .map_err(|e| format!("Token inválido: {}", e))
    }
}