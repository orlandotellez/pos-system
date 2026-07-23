use axum::{
    Extension, Json,
    extract::{Query, State},
};
use uuid::Uuid;

use crate::{
    features::suppliers::{
        application::supplier_service::SupplierService,
        infrastructure::{
            mappers::SupplierListResponse, models::list_suppliers_params::ListSupplierParams,
        },
        presentation::dto::request::SupplierQueryParams,
    },
    shared::{errors::app_error::AppError, security::Claims, state::app_state::AppState},
};

/// Parsea `is_active` desde un string a `Option<bool>`.
/// Acepta: "true"/"false" (case-insensitive) y "1"/"0".
fn parse_bool_opt(s: Option<&str>) -> Option<bool> {
    match s.map(|v| v.to_lowercase()).as_deref() {
        Some("true") | Some("1") => Some(true),
        Some("false") | Some("0") => Some(false),
        _ => None,
    }
}

fn parse_i64_opt(s: Option<&str>) -> Option<i64> {
    s.and_then(|v| v.parse::<i64>().ok())
}

pub async fn list_suppliers(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<SupplierQueryParams>,
) -> Result<Json<SupplierListResponse>, AppError> {
    let store_id: Uuid = claims
        .store_id
        .ok_or_else(|| AppError::Unauthorized("No store context in token".to_string()))?;

    let params: ListSupplierParams = ListSupplierParams {
        search: query.search.filter(|s| !s.trim().is_empty()),
        is_active: parse_bool_opt(query.is_active.as_deref()),
        page: parse_i64_opt(query.page.as_deref()).unwrap_or(1),
        limit: parse_i64_opt(query.limit.as_deref()).unwrap_or(20),
    };

    let response: SupplierListResponse =
        SupplierService::list_suppliers(&state, store_id, params).await?;
    Ok(Json(response))
}
