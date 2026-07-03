use chrono::{DateTime, Utc};
use sqlx::prelude::FromRow;
use uuid::Uuid;

/// Resultado del JOIN entre users y account para login por credenciales.
#[derive(Debug, FromRow)]
pub struct CredentialsAccount {
    pub user_id: Uuid,
    pub name: String,
    pub email: String,
    pub email_verified: bool,
    pub image: Option<String>,
    pub role: Option<String>,
    pub password: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}
