use async_trait::async_trait;
use uuid::Uuid;

use crate::{
    features::suppliers::{
        domain::entities::Supplier,
        infrastructure::models::{
            list_suppliers_params::ListSupplierParams, paginated_result::PaginatedResult,
        },
    },
    shared::errors::app_error::AppError,
};

#[async_trait]
pub trait SupplierRepository: Send + Sync {
    async fn find_paginated(
        &self,
        store_id: Uuid,
        params: ListSupplierParams,
    ) -> Result<PaginatedResult<Supplier>, AppError>;
}
