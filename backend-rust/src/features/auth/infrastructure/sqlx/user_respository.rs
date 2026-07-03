use async_trait::async_trait;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use crate::{
    features::auth::domain::{contracts::user_repository::UserRepository, entities::User},
    shared::errors::app_error::AppError,
};

// ─── Implementación concreta del trait ───

#[derive(Clone)]
pub struct SqlxUserRepository {
    pool: PgPool,
}

impl SqlxUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for SqlxUserRepository {
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT
                id,
                name,
                email,
                email_verified,
                image as "image?",
                role as "role?",
                created_at as "created_at?",
                updated_at as "updated_at?"
            FROM users
            WHERE email = $1 AND deleted_at IS NULL
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT
                id,
                name,
                email,
                email_verified,
                image as "image?",
                role as "role?",
                created_at as "created_at?",
                updated_at as "updated_at?"
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }
}

// ─── Operaciones transaccionales (fuera del trait) ───

impl SqlxUserRepository {
    pub async fn create(
        tx: &mut Transaction<'_, Postgres>,
        name: &str,
        email: &str,
        role: &str,
    ) -> Result<User, AppError> {
        let user: User = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (
                id, name, email, email_verified, role, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                name,
                email,
                email_verified,
                image as "image?",
                role as "role?",
                created_at as "created_at?",
                updated_at as "updated_at?"
            "#,
            Uuid::new_v4(),
            name,
            email,
            false,
            role,
            Utc::now(),
            Utc::now(),
        )
        .fetch_one(tx.as_mut())
        .await?;

        Ok(user)
    }
}
