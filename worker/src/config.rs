use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use worker::*;

const CONFIG_DISPLAY: &str = "shift-display.config.json";
const CONFIG_STYLING: &str = "shift-styling.config.json";

#[derive(Clone, Debug)]
struct CachedConfig {
    json: String,
    fetched_at: DateTime<Utc>,
}

static CONFIG_CACHE: Lazy<RwLock<HashMap<String, CachedConfig>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

#[derive(Deserialize, Default, Serialize)]
pub struct RawShiftDisplayConfig {
    #[serde(default)]
    pub aliases: HashMap<String, String>,
    #[serde(default)]
    pub labels: HashMap<String, String>,
}

#[derive(Deserialize, Default, Serialize)]
pub struct ShiftStylingConfig {
    #[serde(rename = "conditionalUnderline", skip_serializing_if = "Option::is_none")]
    pub conditional_underline: Option<ConditionalUnderline>,
}

#[derive(Deserialize, Clone, Serialize)]
pub struct ConditionalUnderline {
    #[serde(rename = "shiftCode")]
    pub shift_code: String,
    pub weekdays: Vec<u8>,
}

pub struct ShiftDisplayConfig {
    pub alias_map: HashMap<String, String>,
    pub label_map: HashMap<String, String>,
}

impl Default for ShiftDisplayConfig {
    fn default() -> Self {
        ShiftDisplayConfig {
            alias_map: HashMap::new(),
            label_map: HashMap::new(),
        }
    }
}

impl From<RawShiftDisplayConfig> for ShiftDisplayConfig {
    fn from(raw: RawShiftDisplayConfig) -> Self {
        let mut alias_map = HashMap::new();
        for (key, value) in raw.aliases.into_iter() {
            let trimmed_key = key.trim().to_lowercase();
            let trimmed_value = value.trim().to_string();
            if trimmed_key.is_empty() || trimmed_value.is_empty() {
                continue;
            }
            alias_map.insert(trimmed_key, trimmed_value);
        }

        let mut label_map = HashMap::new();
        for (key, value) in raw.labels.into_iter() {
            let trimmed_key = key.trim().to_string();
            let trimmed_value = value.trim().to_string();
            if trimmed_key.is_empty() || trimmed_value.is_empty() {
                continue;
            }
            label_map.insert(trimmed_key.clone(), trimmed_value.clone());
            label_map.insert(trimmed_key.to_uppercase(), trimmed_value.clone());
            label_map.insert(trimmed_key.to_lowercase(), trimmed_value.clone());
        }

        ShiftDisplayConfig {
            alias_map,
            label_map,
        }
    }
}

impl ShiftDisplayConfig {
    pub fn normalize_token(&self, input: &str) -> String {
        let trimmed = input.trim();
        if trimmed.is_empty() {
            return String::new();
        }

        let lookup_key = trimmed.to_lowercase();
        if let Some(value) = self.alias_map.get(&lookup_key) {
            return value.clone();
        }

        if let Some(first_chunk) = trimmed.split_whitespace().next() {
            let chunk_key = first_chunk.trim().to_lowercase();
            if let Some(value) = self.alias_map.get(&chunk_key) {
                return value.clone();
            }
        }

        trimmed.to_string()
    }

    pub fn label_override(&self, key: &str) -> Option<String> {
        if key.trim().is_empty() {
            return None;
        }

        let trimmed = key.trim();
        self.label_map
            .get(trimmed)
            .cloned()
            .or_else(|| self.label_map.get(&trimmed.to_uppercase()).cloned())
            .or_else(|| self.label_map.get(&trimmed.to_lowercase()).cloned())
    }

    pub fn resolve_label(&self, code: &str, raw_label: &str) -> String {
        if let Some(override_label) = self.label_override(code) {
            return override_label;
        }

        let normalized = self.normalize_token(raw_label);
        if let Some(override_label) = self.label_override(&normalized) {
            return override_label;
        }

        if let Some(override_label) = self.label_override(raw_label) {
            return override_label;
        }

        if normalized.is_empty() {
            return code.to_string();
        }

        normalized
    }
}

/// Fetch config from R2 with caching
async fn fetch_config_from_r2(
    bucket: &Bucket,
    config_key: &str,
    cache_ttl_seconds: u64,
) -> Result<String> {
    // Check cache first
    {
        let cache = CONFIG_CACHE.read().map_err(|e| {
            Error::RustError(format!("Failed to acquire cache read lock: {}", e))
        })?;

        if let Some(cached) = cache.get(config_key) {
            let age_seconds = Utc::now()
                .signed_duration_since(cached.fetched_at)
                .num_seconds();

            if age_seconds >= 0 && (age_seconds as u64) < cache_ttl_seconds {
                console_log!("Config cache hit for {}: {} seconds old", config_key, age_seconds);
                return Ok(cached.json.clone());
            } else {
                console_log!("Config cache miss for {}: {} seconds old (stale)", config_key, age_seconds);
            }
        } else {
            console_log!("Config cache miss for {}: not found", config_key);
        }
    }

    // Fetch from R2
    console_log!("Fetching config from R2: {}", config_key);
    let object = bucket.get(config_key).execute().await?;

    let bytes = match object {
        Some(obj) => {
            let body = obj.body()
                .ok_or_else(|| Error::RustError(format!("Config {} has no body", config_key)))?;
            body.bytes().await?
        }
        None => {
            console_log!("Config {} not found in R2, using empty default", config_key);
            return Ok("{}".to_string());
        }
    };
    let json_str = String::from_utf8(bytes.to_vec())
        .map_err(|e| Error::RustError(format!("Invalid UTF-8 in config {}: {}", config_key, e)))?;

    // Validate JSON
    let _: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| Error::RustError(format!("Invalid JSON in config {}: {}", config_key, e)))?;

    // Update cache
    {
        let mut cache = CONFIG_CACHE.write().map_err(|e| {
            Error::RustError(format!("Failed to acquire cache write lock: {}", e))
        })?;

        cache.insert(
            config_key.to_string(),
            CachedConfig {
                json: json_str.clone(),
                fetched_at: Utc::now(),
            },
        );
    }

    Ok(json_str)
}

/// Get shift display config from R2
pub async fn get_shift_display_config(
    bucket: &Bucket,
    cache_ttl_seconds: u64,
) -> Result<ShiftDisplayConfig> {
    let json_str = fetch_config_from_r2(bucket, CONFIG_DISPLAY, cache_ttl_seconds).await?;

    let raw: RawShiftDisplayConfig = serde_json::from_str(&json_str)
        .unwrap_or_else(|e| {
            console_log!("Failed to parse shift display config: {:?}, using defaults", e);
            RawShiftDisplayConfig::default()
        });

    Ok(ShiftDisplayConfig::from(raw))
}

/// Get shift styling config from R2
pub async fn get_shift_styling_config(
    bucket: &Bucket,
    cache_ttl_seconds: u64,
) -> Result<ShiftStylingConfig> {
    let json_str = fetch_config_from_r2(bucket, CONFIG_STYLING, cache_ttl_seconds).await?;

    let config: ShiftStylingConfig = serde_json::from_str(&json_str)
        .unwrap_or_else(|e| {
            console_log!("Failed to parse shift styling config: {:?}, using defaults", e);
            ShiftStylingConfig::default()
        });

    Ok(config)
}

/// API endpoint: Get config by name
pub async fn handle_get_config(
    _req: Request,
    ctx: RouteContext<()>,
    config_name: String,
) -> Result<Response> {
    let bucket = ctx.bucket("CONFIG_BUCKET")?;

    let cache_ttl_seconds = ctx
        .var("CONFIG_CACHE_TTL_SECONDS")
        .ok()
        .and_then(|v| v.to_string().parse::<u64>().ok())
        .unwrap_or(300);

    let config_key = match config_name.as_str() {
        "shift-display" => CONFIG_DISPLAY,
        "shift-styling" => CONFIG_STYLING,
        _ => {
            return Response::error("Invalid config name", 400);
        }
    };

    match fetch_config_from_r2(&bucket, config_key, cache_ttl_seconds).await {
        Ok(json_str) => {
            let headers = Headers::new();
            headers.set("Content-Type", "application/json")?;
            headers.set("Cache-Control", &format!("public, max-age={}", cache_ttl_seconds))?;
            headers.set("Access-Control-Allow-Origin", "*")?;

            Ok(Response::ok(json_str)?.with_headers(headers))
        }
        Err(e) => {
            console_error!("Error fetching config {}: {:?}", config_name, e);
            Response::error(format!("Failed to fetch config: {}", e), 500)
        }
    }
}

/// Clear config cache (useful for testing/admin)
pub fn clear_config_cache() {
    if let Ok(mut cache) = CONFIG_CACHE.write() {
        cache.clear();
        console_log!("Config cache cleared");
    }
}
