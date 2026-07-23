use uuid::Uuid;

use crate::{
    features::suppliers::{
        domain::{contracts::supplier_repository::SupplierRepository, entities::Supplier},
        infrastructure::{
            mappers::SupplierListResponse,
            models::{
                list_suppliers_params::ListSupplierParams, paginated_result::PaginatedResult,
            },
            sqlx::supplier_repository::SqlxSupplierRepository,
        },
    },
    shared::{errors::app_error::AppError, state::app_state::AppState},
};

pub struct SupplierService;

impl SupplierService {
    pub async fn list_suppliers(
        state: &AppState,
        store_id: Uuid,
        params: ListSupplierParams,
    ) -> Result<SupplierListResponse, AppError> {
        let params: ListSupplierParams = params.normalize();
        let page: i64 = params.page;
        let limit: i64 = params.limit;

        let repo: SqlxSupplierRepository = SqlxSupplierRepository::new(state.db.clone());
        let result: PaginatedResult<Supplier> = repo.find_paginated(store_id, params).await?;

        Ok(SupplierListResponse::build(
            result.items,
            result.total,
            page,
            limit,
        ))
    }
}
