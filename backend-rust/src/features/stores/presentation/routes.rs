use axum::{routing::post, Router};

use crate::{
    features::stores::presentation::handlers::store_handler,
    shared::state::app_state::AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new().route("/register-store", post(store_handler::register_store))
}
