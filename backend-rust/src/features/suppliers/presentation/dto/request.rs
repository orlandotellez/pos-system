use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierQueryParams {
    pub search: Option<String>,
    pub is_active: Option<String>, // "true" | "false" | "1" | "0"
    pub page: Option<String>,
    pub limit: Option<String>,
}
