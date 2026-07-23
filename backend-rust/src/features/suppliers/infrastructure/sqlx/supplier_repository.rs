use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::{
    features::suppliers::{
        domain::{contracts::supplier_repository::SupplierRepository, entities::Supplier},
        infrastructure::models::{
            list_suppliers_params::ListSupplierParams, paginated_result::PaginatedResult,
        },
    },
    shared::errors::app_error::AppError,
};

#[derive(Clone)]
pub struct SqlxSupplierRepository {
    pool: PgPool,
}

impl SqlxSupplierRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait::async_trait]
impl SupplierRepository for SqlxSupplierRepository {
    async fn find_paginated(
        &self,
        store_id: Uuid,
        params: ListSupplierParams,
    ) -> Result<PaginatedResult<Supplier>, AppError> {
        let offset: i64 = params.offset();

        let mut count_qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "SELECT COUNT(*) FROM suppliers WHERE deleted_at IS NULL AND store_id = ",
        );
        count_qb.push_bind(store_id);

        if let Some(ref s) = params.search {
            let pat = format!("%{}%", s);
            count_qb.push(" AND (name ILIKE ");
            count_qb.push_bind(pat.clone());
            count_qb.push(" OR contact_name ILIKE ");
            count_qb.push_bind(pat);
            count_qb.push(")");
        }

        if let Some(is_active) = params.is_active {
            count_qb.push(" AND is_active = ");
            count_qb.push_bind(is_active);
        }

        let total: i64 = count_qb
            .build_query_scalar::<i64>()
            .fetch_one(&self.pool)
            .await?;

        // SELECT para los items
        let mut items_qb: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT 
                id, 
                name, 
                contact_name, 
                email, 
                phone, 
                address, 
                notes,
                is_active, 
                store_id, 
                created_at, 
                updated_at, 
                deleted_at
            FROM suppliers
            WHERE deleted_at IS NULL AND store_id = "#,
        );
        items_qb.push_bind(store_id);

        if let Some(ref s) = params.search {
            let pat = format!("%{}%", s);
            items_qb.push(" AND (name ILIKE ");
            items_qb.push_bind(pat.clone());
            items_qb.push(" OR contact_name ILIKE ");
            items_qb.push_bind(pat);
            items_qb.push(")");
        }

        if let Some(is_active) = params.is_active {
            items_qb.push(" AND is_active = ");
            items_qb.push_bind(is_active);
        }

        items_qb.push(" ORDER BY name ASC LIMIT ");
        items_qb.push_bind(params.limit);
        items_qb.push(" OFFSET ");
        items_qb.push_bind(offset);

        let items: Vec<Supplier> = items_qb
            .build_query_as::<Supplier>()
            .fetch_all(&self.pool)
            .await?;

        Ok(PaginatedResult::new(items, total))
    }
}
