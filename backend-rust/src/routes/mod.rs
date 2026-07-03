use axum::Router;

use crate::{features, shared::state::app_state::AppState};

pub fn create_routes() -> Router<AppState> {
    Router::new().nest(
        "/api/v1/auth",
        features::auth::presentation::routes::routes(),
    )
}
