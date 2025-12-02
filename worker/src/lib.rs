use chrono::{DateTime, Utc};
use constant_time_eq::constant_time_eq;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::RwLock;
use worker::*;

mod utils;

const UPSTREAM_TIMEOUT_MESSAGE: &str = "Upstream request timed out";

// Environment variables
struct Config {
    api_base_url: String,
    api_token: String,
    api_timeout_ms: u64,
    cache_ttl_seconds: u64,
}

#[derive(Clone)]
struct CachedSchedule {
    json: String,
    fetched_at: DateTime<Utc>,
}

static SCHEDULE_CACHE: Lazy<RwLock<HashMap<String, CachedSchedule>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

#[derive(Deserialize, Default)]
struct RawShiftDisplayConfig {
    #[serde(default)]
    aliases: HashMap<String, String>,
    #[serde(default)]
    labels: HashMap<String, String>,
}

struct ShiftDisplayConfig {
    alias_map: HashMap<String, String>,
    label_map: HashMap<String, String>,
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
    fn normalize_token(&self, input: &str) -> String {
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

    fn label_override(&self, key: &str) -> Option<String> {
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

    fn resolve_label(&self, code: &str, raw_label: &str) -> String {
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

static SHIFT_DISPLAY_CONFIG: Lazy<ShiftDisplayConfig> = Lazy::new(|| {
    let raw_json = include_str!("../../src/config/shift-display.config.json");
    match serde_json::from_str::<RawShiftDisplayConfig>(raw_json) {
        Ok(raw) => ShiftDisplayConfig::from(raw),
        Err(error) => {
            console_log!("Failed to parse shift display config: {:?}", error);
            ShiftDisplayConfig::default()
        }
    }
});

// Frontend types (MonthShifts contract)
#[derive(Serialize)]
struct MonthShifts {
    ym: String,
    people: Vec<Person>,
    rows: Vec<Vec<Option<Vec<String>>>>,
    codes: Vec<String>,
    #[serde(rename = "shiftNames")]
    shift_names: HashMap<String, String>,
}

#[derive(Serialize, Clone)]
struct Person {
    id: String,
    name: String,
}

// API Error response
#[derive(Serialize)]
struct ApiError {
    error: ErrorDetails,
}

// Password check types
#[derive(Deserialize)]
struct AccessRequest {
    password: String,
}

#[derive(Serialize)]
struct AccessResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    token: Option<String>,
}

#[derive(Serialize)]
struct ErrorDetails {
    code: String,
    message: String,
}

// Upstream MetricAid API types
#[derive(Deserialize)]
struct UpstreamResponse {
    data: Vec<UpstreamShift>,
}

#[derive(Deserialize)]
struct UpstreamShift {
    start_time: String,
    #[allow(dead_code)]
    end_time: String,
    shift: ShiftDetails,
    user: UserDetails,
}

#[derive(Deserialize)]
struct ShiftDetails {
    #[allow(dead_code)]
    name: String,
    alias: String,
    #[serde(default)]
    #[allow(dead_code)]
    color: Option<String>,
}

#[derive(Deserialize)]
struct UserDetails {
    id: Option<u64>,
    fname: Option<String>,
    lname: Option<String>,
    #[serde(default)]
    #[allow(dead_code)]
    mname: Option<String>,
}

fn log_request(req: &Request) {
    let cf_coords = req.cf().map(|cf| cf.coordinates()).flatten().unwrap_or_default();
    let cf_region = req.cf().and_then(|cf| cf.region()).unwrap_or_else(|| "unknown region".into());
    console_log!(
        "{} - [{}], located at: {:?}, within: {}",
        Date::now().to_string(),
        req.path(),
        cf_coords,
        cf_region
    );
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    log_request(&req);

    // Setup panic hook for better error messages
    utils::set_panic_hook();

    // CORS preflight
    if req.method() == Method::Options {
        return handle_options_with_origin(&req);
    }

    // Router
    let router = Router::new();
    router
        .post_async("/api/access", |req, ctx| async move {
            handle_access(req, ctx).await
        })
        .get_async("/api/check-access", |req, ctx| async move {
            handle_check_access(req, ctx).await
        })
        .get_async("/api/shifts", |req, ctx| async move {
            handle_shifts(req, ctx).await
        })
        .run(req, env)
        .await
}

async fn handle_shifts(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Parse config from environment
    let config = match get_config(&ctx) {
        Ok(cfg) => cfg,
        Err(e) => return error_response("CONFIG_ERROR", &e.to_string(), 500),
    };

    // Validate and extract ym parameter
    let url = req.url()?;
    let ym = match url.query_pairs().find(|(k, _)| k == "ym") {
        Some((_, v)) => v.to_string(),
        None => return error_response("MISSING_PARAM", "Missing required parameter: ym", 400),
    };

    if !is_valid_ym(&ym) {
        return error_response("INVALID_YM", "Invalid ym format. Expected YYYY-MM", 400);
    }

    // Calculate month boundaries
    let (start_date, end_date) = match get_month_bounds(&ym) {
        Ok(bounds) => bounds,
        Err(e) => return error_response("DATE_ERROR", &e.to_string(), 400),
    };

    let cache_ttl_seconds = config.cache_ttl_seconds;

    if let Some(cached_json) = get_cached_schedule(&ym, cache_ttl_seconds) {
        return build_success_response(cached_json, cache_ttl_seconds, "HIT");
    }

    // Build upstream URL with token as query parameter
    let upstream_url = format!(
        "{}/public/schedule?token={}&startDate={}&endDate={}&scheduleVersion=live",
        config.api_base_url, config.api_token, start_date, end_date
    );

    // Fetch from upstream API with timeout and retry
    let upstream_data = match fetch_with_retry(
        &upstream_url,
        config.api_timeout_ms,
        2,
        None,
    )
    .await
    {
        Ok(data) => data,
        Err(e) => {
            let message = e.to_string();
            if message == UPSTREAM_TIMEOUT_MESSAGE {
                return error_response("UPSTREAM_TIMEOUT", &message, 504);
            }
            return error_response("UPSTREAM_ERROR", &message, 502);
        }
    };

    // Parse upstream response
    let upstream: UpstreamResponse = match serde_json::from_str(&upstream_data) {
        Ok(data) => data,
        Err(e) => {
            return error_response(
                "PARSE_ERROR",
                &format!("Failed to parse upstream response: {}", e),
                500,
            )
        }
    };

    // Transform to MonthShifts format
    let month_shifts = transform_to_month_shifts(ym.clone(), upstream.data);

    // Build response with caching
    let json = serde_json::to_string(&month_shifts)?;
    store_schedule_in_cache(&ym, json.clone());

    build_success_response(json, cache_ttl_seconds, "MISS")
}

fn get_cached_schedule(ym: &str, ttl_seconds: u64) -> Option<String> {
    if ttl_seconds == 0 {
        return None;
    }

    let cached = {
        let cache = SCHEDULE_CACHE.read().ok()?;
        cache.get(ym).cloned()
    }?;

    let age_seconds = Utc::now()
        .signed_duration_since(cached.fetched_at)
        .num_seconds();

    if age_seconds < ttl_seconds as i64 {
        Some(cached.json)
    } else {
        if let Ok(mut cache) = SCHEDULE_CACHE.write() {
            cache.remove(ym);
        }
        None
    }
}

fn store_schedule_in_cache(ym: &str, json: String) {
    if let Ok(mut cache) = SCHEDULE_CACHE.write() {
        cache.insert(
            ym.to_string(),
            CachedSchedule {
                json,
                fetched_at: Utc::now(),
            },
        );
    }
}

fn build_success_response(json: String, ttl_seconds: u64, cache_status: &str) -> Result<Response> {
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set(
        "Cache-Control",
        &format!("public, max-age={}", ttl_seconds.max(1)),
    )?;
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Vary", "Origin")?;
    headers.set("X-Cache-Status", cache_status)?;

    Ok(Response::ok(json)?.with_headers(headers))
}

fn get_config(ctx: &RouteContext<()>) -> Result<Config> {
    Ok(Config {
        api_base_url: ctx.var("API_BASE_URL")?.to_string(),
        api_token: ctx.secret("API_TOKEN")?.to_string(),
        api_timeout_ms: ctx
            .var("API_TIMEOUT_MS")?
            .to_string()
            .parse()
            .unwrap_or(8000),
        cache_ttl_seconds: ctx
            .var("CACHE_TTL_SECONDS")?
            .to_string()
            .parse()
            .unwrap_or(900),
    })
}

fn is_valid_ym(ym: &str) -> bool {
    // Validate YYYY-MM format
    let parts: Vec<&str> = ym.split('-').collect();
    if parts.len() != 2 {
        return false;
    }

    if let (Ok(year), Ok(month)) = (parts[0].parse::<u32>(), parts[1].parse::<u32>()) {
        year >= 2000 && year <= 2100 && month >= 1 && month <= 12
    } else {
        false
    }
}

fn get_month_bounds(ym: &str) -> Result<(String, String)> {
    let parts: Vec<&str> = ym.split('-').collect();
    let year: i32 = parts[0]
        .parse()
        .map_err(|_| Error::RustError("Invalid year".to_string()))?;
    let month: u32 = parts[1]
        .parse()
        .map_err(|_| Error::RustError("Invalid month".to_string()))?;

    // Calculate days in month
    let days_in_month = if month == 12 {
        chrono::NaiveDate::from_ymd_opt(year + 1, 1, 1)
            .unwrap()
            .signed_duration_since(chrono::NaiveDate::from_ymd_opt(year, month, 1).unwrap())
            .num_days()
    } else {
        chrono::NaiveDate::from_ymd_opt(year, month + 1, 1)
            .unwrap()
            .signed_duration_since(chrono::NaiveDate::from_ymd_opt(year, month, 1).unwrap())
            .num_days()
    };

    let start_date = format!("{}-01", ym);
    let end_date = format!("{}-{:02}", ym, days_in_month);

    Ok((start_date, end_date))
}

async fn fetch_with_retry(
    url: &str,
    _timeout_ms: u64,
    max_retries: u32,
    headers: Option<&[(String, String)]>,
) -> Result<String> {
    let mut retries = 0;

    loop {
        let mut request_init = RequestInit::new();
        request_init.with_method(Method::Get);

        let mut request = Request::new_with_init(url, &request_init)?;

        if let Some(headers) = headers {
            for (name, value) in headers {
                request.headers_mut()?.set(name, value)?;
            }
        }

        match Fetch::Request(request).send().await {
            Ok(mut response) => {
                if response.status_code() >= 200 && response.status_code() < 300 {
                    return response.text().await;
                } else if response.status_code() >= 500 && retries < max_retries {
                    retries += 1;
                    continue;
                } else {
                    return Err(Error::RustError(format!(
                        "Upstream returned status {}",
                        response.status_code()
                    )));
                }
            }
            Err(_e) if retries < max_retries => {
                retries += 1;
                continue;
            }
            Err(e) => return Err(e),
        }
    }
}

fn transform_to_month_shifts(ym: String, shifts: Vec<UpstreamShift>) -> MonthShifts {
    // Extract unique people
    let mut people_map: HashMap<String, Person> = HashMap::new();
    let mut shift_codes: HashSet<String> = HashSet::new();
    let mut shift_names: HashMap<String, String> = HashMap::new();

    for shift in &shifts {
        let fname = shift.user.fname.as_deref().unwrap_or("Unknown");
        let lname = shift.user.lname.as_deref().unwrap_or("");

        let user_id = shift.user.id
            .map(|id| id.to_string())
            .unwrap_or_else(|| format!("{}_{}", fname, lname));
        people_map.entry(user_id.clone()).or_insert_with(|| Person {
            id: user_id.clone(),
            name: format!("{} {}", fname, lname).trim().to_string(),
        });

        // Extract shift code from alias (remove time portion)
        let code = extract_shift_code(&shift.shift.alias);
        if !code.is_empty() {
            shift_codes.insert(code.clone());
            let resolved_label = SHIFT_DISPLAY_CONFIG.resolve_label(&code, &shift.shift.alias);
            shift_names.insert(code.clone(), resolved_label);
        }
    }

    // Sort people by ID for consistency
    let mut people: Vec<Person> = people_map.values().cloned().collect();
    people.sort_by(|a, b| a.id.cmp(&b.id));

    // Get days in month
    let days_in_month = get_days_in_month(&ym);

    // Build rows matrix (people x days) - each cell can have multiple shifts
    let mut rows: Vec<Vec<Option<Vec<String>>>> = vec![vec![None; days_in_month]; people.len()];

    // Create person_id -> index mapping
    let person_indices: HashMap<String, usize> = people
        .iter()
        .enumerate()
        .map(|(i, p)| (p.id.clone(), i))
        .collect();

    // Fill in the matrix - support multiple shifts per day
    for shift in shifts {
        let fname = shift.user.fname.as_deref().unwrap_or("Unknown");
        let lname = shift.user.lname.as_deref().unwrap_or("");

        let user_id = shift.user.id
            .map(|id| id.to_string())
            .unwrap_or_else(|| format!("{}_{}", fname, lname));
        if let Some(&person_idx) = person_indices.get(&user_id) {
            // Extract day from start_time (format: "YYYY-MM-DD HH:MM:SS")
            if let Some(day) = extract_day_from_datetime(&shift.start_time) {
                if day > 0 && day <= days_in_month {
                    let code = extract_shift_code(&shift.shift.alias);
                    // Append to existing shifts for this day
                    if let Some(ref mut shift_codes) = rows[person_idx][day - 1] {
                        shift_codes.push(code);
                    } else {
                        rows[person_idx][day - 1] = Some(vec![code]);
                    }
                }
            }
        }
    }

    // Convert codes to sorted vec
    let mut codes: Vec<String> = shift_codes.into_iter().collect();
    codes.sort();

    MonthShifts {
        ym,
        people,
        rows,
        codes,
        shift_names,
    }
}

fn get_days_in_month(ym: &str) -> usize {
    let parts: Vec<&str> = ym.split('-').collect();
    let year: i32 = parts[0].parse().unwrap();
    let month: u32 = parts[1].parse().unwrap();

    let days = if month == 12 {
        chrono::NaiveDate::from_ymd_opt(year + 1, 1, 1)
            .unwrap()
            .signed_duration_since(chrono::NaiveDate::from_ymd_opt(year, month, 1).unwrap())
            .num_days()
    } else {
        chrono::NaiveDate::from_ymd_opt(year, month + 1, 1)
            .unwrap()
            .signed_duration_since(chrono::NaiveDate::from_ymd_opt(year, month, 1).unwrap())
            .num_days()
    };

    days as usize
}

fn extract_day_from_datetime(datetime: &str) -> Option<usize> {
    // Parse "YYYY-MM-DD HH:MM:SS" format
    let parts: Vec<&str> = datetime.split_whitespace().next()?.split('-').collect();
    if parts.len() == 3 {
        parts[2].parse().ok()
    } else {
        None
    }
}

fn extract_shift_code(alias: &str) -> String {
    // Extract shift code from alias like "RATM 8:00AM - 2:00PM" -> "RATM"
    // or "FT 8:30am - 6:30" -> "FT"
    // Just take everything before the first space or digit and normalise using config
    let token = alias
        .split_whitespace()
        .next()
        .unwrap_or(alias)
        .trim();

    let normalised = SHIFT_DISPLAY_CONFIG.normalize_token(token);
    if normalised.is_empty() {
        return token.to_string();
    }

    normalised
}

fn has_access_token(req: &Request, ctx: &RouteContext<()>) -> bool {
    // Check for token in Authorization header
    if let Ok(Some(auth_header)) = req.headers().get("Authorization") {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            // Get expected password from environment
            if let Ok(expected_password) = ctx.secret("ACCESS_PASSWORD") {
                let expected = expected_password.to_string();
                return constant_time_eq(token.trim().as_bytes(), expected.trim().as_bytes());
            }
        }
    }
    // Fallback: check for old cookie-based auth for backward compatibility
    if let Ok(Some(cookie_header)) = req.headers().get("Cookie") {
        return cookie_header
            .split(';')
            .any(|cookie| cookie.trim().starts_with("schedule_viewer_access=granted"));
    }
    false
}

async fn handle_check_access(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());

    let has_access = has_access_token(&req, &ctx);

    let response = AccessResponse {
        success: has_access,
        error: None,
        token: None,
    };

    let json = serde_json::to_string(&response)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", &origin)?;
    headers.set("Access-Control-Allow-Credentials", "true")?;
    headers.set("Cache-Control", "no-store, must-revalidate")?;

    Ok(Response::ok(json)?.with_headers(headers))
}

async fn handle_access(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Get origin for CORS
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());

    // Parse request body
    let body: AccessRequest = match req.json().await {
        Ok(b) => b,
        Err(_) => {
            return error_response_with_origin("INVALID_REQUEST", "Invalid JSON", 400, &origin);
        }
    };

    // Get expected password from environment secret
    let expected_password = match ctx.secret("ACCESS_PASSWORD") {
        Ok(secret) => secret.to_string(),
        Err(_) => {
            return error_response_with_origin("CONFIG_ERROR", "Password not configured", 500, &origin);
        }
    };

    let candidate = body.password.trim();
    let expected = expected_password.trim();

    // Constant-time comparison to prevent timing attacks
    let is_valid = constant_time_eq(candidate.as_bytes(), expected.as_bytes());

    if !is_valid {
        let response = AccessResponse {
            success: false,
            error: Some("Password non valida. Riprova.".to_string()),
            token: None,
        };

        let json = serde_json::to_string(&response)?;
        let mut headers = Headers::new();
        headers.set("Content-Type", "application/json")?;
        headers.set("Access-Control-Allow-Origin", &origin)?;
        headers.set("Access-Control-Allow-Credentials", "true")?;

        return Ok(Response::error(json, 401)?.with_headers(headers));
    }

    // Success - return token in response body (password is the token)
    // Client will store this in localStorage and send it in Authorization header
    let response = AccessResponse {
        success: true,
        error: None,
        token: Some(expected_password),
    };

    let json = serde_json::to_string(&response)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", &origin)?;
    headers.set("Access-Control-Allow-Credentials", "true")?;

    Ok(Response::ok(json)?.with_headers(headers))
}

fn handle_options_with_origin(req: &Request) -> Result<Response> {
    let mut headers = Headers::new();

    // Get origin from request, default to * if not present
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());

    headers.set("Access-Control-Allow-Origin", &origin)?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")?;
    headers.set("Access-Control-Allow-Credentials", "true")?;
    headers.set("Access-Control-Max-Age", "86400")?;

    Ok(Response::empty()?.with_headers(headers).with_status(204))
}

fn error_response(code: &str, message: &str, status: u16) -> Result<Response> {
    error_response_with_origin(code, message, status, "*")
}

fn error_response_with_origin(code: &str, message: &str, status: u16, origin: &str) -> Result<Response> {
    let error = ApiError {
        error: ErrorDetails {
            code: code.to_string(),
            message: message.to_string(),
        },
    };

    let json = serde_json::to_string(&error)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", origin)?;
    headers.set("Access-Control-Allow-Credentials", "true")?;

    Ok(Response::error(json, status)?.with_headers(headers))
}
