use axum::{Router, middleware, routing::get};

use crate::{
    features::suppliers::presentation::handlers::supplier_handler::{get_supplier, list_suppliers},
    shared::{security::auth_guard::require_auth_middleware, state::app_state::AppState},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_suppliers))
        .route("/{id}", get(get_supplier))
        .route_layer(middleware::from_fn(require_auth_middleware))
}
