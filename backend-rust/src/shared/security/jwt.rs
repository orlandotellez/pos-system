use jsonwebtoken::{decode, encode, errors::Error as JwtError, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::shared::config::constants::{JWT_REFRESH_SECRET, JWT_SECRET};

const ACCESS_TOKEN_EXPIRY_SECS: i64 = 900; // 15 minutos
const REFRESH_TOKEN_EXPIRY_SECS: i64 = 604800; // 7 días

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessTokenClaims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub jti: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenClaims {
    pub sub: String,
    pub jti: String,
    pub exp: usize,
    pub iat: usize,
}

pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
}

pub fn generate_tokens(user_id: &str, email: &str, role: &str) -> Result<TokenPair, JwtError> {
    let now = OffsetDateTime::now_utc().unix_timestamp() as usize;

    let jti = Uuid::new_v4().to_string();

    let access_claims = AccessTokenClaims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        jti: jti.clone(),
        iat: now,
        exp: now + ACCESS_TOKEN_EXPIRY_SECS as usize,
    };

    let refresh_claims = RefreshTokenClaims {
        sub: user_id.to_string(),
        jti,
        iat: now,
        exp: now + REFRESH_TOKEN_EXPIRY_SECS as usize,
    };

    let access_token = encode(
        &Header::default(),
        &access_claims,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
    )?;

    let refresh_token = encode(
        &Header::default(),
        &refresh_claims,
        &EncodingKey::from_secret(JWT_REFRESH_SECRET.as_bytes()),
    )?;

    Ok(TokenPair {
        access_token,
        refresh_token,
    })
}

pub fn verify_access_token(token: &str) -> Result<AccessTokenClaims, JwtError> {
    let data = decode::<AccessTokenClaims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &Validation::default(),
    )?;

    Ok(data.claims)
}

pub fn verify_refresh_token(token: &str) -> Result<RefreshTokenClaims, JwtError> {
    let data = decode::<RefreshTokenClaims>(
        token,
        &DecodingKey::from_secret(JWT_REFRESH_SECRET.as_bytes()),
        &Validation::default(),
    )?;

    Ok(data.claims)
}
