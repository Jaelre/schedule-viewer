use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{DateTime, Utc};
use constant_time_eq::constant_time_eq;
use hmac::{Hmac, Mac};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::Sha256;
use std::collections::{HashMap, HashSet};
use std::sync::RwLock;
use worker::*;

mod config;
mod utils;

const UPSTREAM_TIMEOUT_MESSAGE: &str = "Upstream request timed out";
const SESSION_COOKIE: &str = "schedule_viewer_session";
const VISITOR_COOKIE: &str = "schedule_viewer_vid";
const LEGACY_ACCESS_COOKIE: &str = "schedule_viewer_access";
const DEFAULT_SESSION_TTL_SECONDS: u64 = 60 * 60 * 24 * 30;
const VISITOR_COOKIE_TTL_SECONDS: u64 = 60 * 60 * 24 * 365;
const TELEMETRY_ARCHIVE_MAX_PART_BYTES: usize = 10 * 1024 * 1024;

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

// Telemetry structures
type JsonMap = Map<String, Value>;

#[derive(Deserialize, Default)]
struct TelemetryBatch {
    #[serde(default)]
    events: Vec<TelemetryEvent>,
    #[serde(default)]
    flush: bool,
    #[serde(default)]
    stream: Option<String>,
}

#[derive(Deserialize)]
struct TelemetryEvent {
    #[serde(flatten)]
    fields: JsonMap,
}

#[derive(Serialize, Clone)]
struct EnrichedTelemetryEvent {
    #[serde(flatten)]
    fields: JsonMap,
    metadata: TelemetryMetadata,
}

#[derive(Serialize, Clone)]
struct TelemetryMetadata {
    #[serde(skip_serializing_if = "Option::is_none")]
    user_agent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ip_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    region: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    visitor_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stream: Option<String>,
    received_at: String,
}

const TELEMETRY_BUFFER_MAX_EVENTS: usize = 50;
const TELEMETRY_BUFFER_TTL_SECONDS: i64 = 30;

static TELEMETRY_BUFFER: Lazy<RwLock<TelemetryBuffer>> =
    Lazy::new(|| RwLock::new(TelemetryBuffer::default()));

struct TelemetryBuffer {
    events: Vec<EnrichedTelemetryEvent>,
    last_flush: DateTime<Utc>,
}

impl TelemetryBuffer {
    fn new() -> Self {
        Self {
            events: Vec::new(),
            last_flush: Utc::now(),
        }
    }

    fn ingest(
        &mut self,
        new_events: Vec<EnrichedTelemetryEvent>,
        force_flush: bool,
    ) -> TelemetryIngestResult {
        let has_new = !new_events.is_empty();
        if has_new {
            self.events.extend(new_events);
        }

        let now = Utc::now();
        let ttl_elapsed = now.signed_duration_since(self.last_flush).num_seconds()
            >= TELEMETRY_BUFFER_TTL_SECONDS;

        let should_flush =
            force_flush || self.events.len() >= TELEMETRY_BUFFER_MAX_EVENTS || ttl_elapsed;

        if should_flush && !self.events.is_empty() {
            let events_to_flush = self.events.clone();
            self.events.clear();
            self.last_flush = now;
            TelemetryIngestResult::Flush(events_to_flush)
        } else if has_new {
            TelemetryIngestResult::Buffered
        } else {
            TelemetryIngestResult::Noop
        }
    }
}

impl Default for TelemetryBuffer {
    fn default() -> Self {
        TelemetryBuffer::new()
    }
}

enum TelemetryIngestResult {
    Noop,
    Buffered,
    Flush(Vec<EnrichedTelemetryEvent>),
}

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

// Feedback submission types
#[derive(Deserialize)]
struct FeedbackRequest {
    feedback_text: String,
    #[serde(default)]
    signature: Option<String>,
    #[serde(default)]
    metadata: JsonMap,
}

#[derive(Serialize)]
struct FeedbackResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct ViewerSessionClaims {
    sid: String,
    vid: String,
    iat: i64,
    exp: i64,
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
    let cf_coords = req
        .cf()
        .map(|cf| cf.coordinates())
        .flatten()
        .unwrap_or_default();
    let cf_region = req
        .cf()
        .and_then(|cf| cf.region())
        .unwrap_or_else(|| "unknown region".into());
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
        .get_async("/api/config/:name", |req, ctx| async move {
            let name = ctx.param("name").map_or("".to_string(), |v| v.to_string());
            config::handle_get_config(req, ctx, name).await
        })
        .post_async("/api/telemetry", |req, ctx| async move {
            handle_telemetry(req, ctx).await
        })
        .post_async("/api/feedback", |req, ctx| async move {
            handle_feedback(req, ctx).await
        })
        .run(req, env)
        .await
}

#[event(scheduled)]
pub async fn handle_scheduled(event: ScheduledEvent, env: Env, _ctx: ScheduleContext) {
    if !resolve_bool_var(&env, "TELEMETRY_ARCHIVE_TO_R2", true) {
        return;
    }

    if resolve_telemetry_archive_mode(&env) != "daily" {
        return;
    }

    let archive_day = Utc::now().date_naive() - chrono::Duration::days(1);

    match export_daily_archive_from_supabase(&env, archive_day).await {
        Ok(()) => {
            console_log!(
                "Scheduled telemetry archive export completed for {} via cron {}",
                archive_day.format("%Y-%m-%d"),
                event.cron()
            );
        }
        Err(error) => {
            console_error!("Scheduled telemetry archive export failed: {:?}", error);
        }
    }
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

    // Fetch shift display config from R2
    let bucket = ctx.bucket("CONFIG_BUCKET")?;
    let config_cache_ttl = ctx
        .var("CONFIG_CACHE_TTL_SECONDS")
        .ok()
        .and_then(|v| v.to_string().parse::<u64>().ok())
        .unwrap_or(300);

    let shift_display_config =
        match config::get_shift_display_config(&bucket, config_cache_ttl).await {
            Ok(cfg) => cfg,
            Err(e) => {
                console_log!(
                    "Failed to fetch shift display config from R2: {:?}, using defaults",
                    e
                );
                config::ShiftDisplayConfig::default()
            }
        };

    // Build upstream URL with token as query parameter
    let upstream_url = format!(
        "{}/public/schedule?token={}&startDate={}&endDate={}&scheduleVersion=live",
        config.api_base_url, config.api_token, start_date, end_date
    );

    // Fetch from upstream API with timeout and retry
    let upstream_data = match fetch_with_retry(&upstream_url, config.api_timeout_ms, 2, None).await
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
    let month_shifts = transform_to_month_shifts(ym.clone(), upstream.data, &shift_display_config);

    // Build response with caching
    let json = serde_json::to_string(&month_shifts)?;
    store_schedule_in_cache(&ym, json.clone());

    build_success_response(json, cache_ttl_seconds, "MISS")
}

async fn flush_events_to_storage(
    events: &[EnrichedTelemetryEvent],
    bucket: Option<&Bucket>,
    log_only: bool,
) -> Result<()> {
    let payload = serde_json::to_string(&events)
        .map_err(|e| Error::RustError(format!("Failed to serialize telemetry: {}", e)))?;

    // Always log for debugging
    console_log!(
        "Telemetry flush ({} events) at {}: {}",
        events.len(),
        Utc::now().to_rfc3339(),
        if log_only { &payload } else { "[see R2]" }
    );

    if log_only {
        return Ok(());
    }

    // Store to R2: <ymd>/<uuid>.jsonl
    let bucket = match bucket {
        Some(b) => b,
        None => {
            console_log!("TELEMETRY_BUCKET not configured, cannot persist to R2");
            return Ok(());
        }
    };

    let now = Utc::now();
    let date_path = now.format("%Y%m%d").to_string();
    let uuid = uuid::Uuid::new_v4().to_string();
    let key = format!("{}/{}.jsonl", date_path, uuid);

    // Convert events to JSONL format (one JSON object per line)
    let jsonl: String = events
        .iter()
        .filter_map(|event| serde_json::to_string(event).ok())
        .collect::<Vec<_>>()
        .join("\n");

    bucket
        .put(&key, jsonl.into_bytes())
        .execute()
        .await
        .map_err(|e| Error::RustError(format!("Failed to write to R2: {:?}", e)))?;

    console_log!("Telemetry written to R2: {}", key);

    Ok(())
}

fn resolve_bool_var(env: &Env, name: &str, default: bool) -> bool {
    env.var(name)
        .ok()
        .and_then(|value| value.to_string().parse::<bool>().ok())
        .unwrap_or(default)
}

fn resolve_telemetry_archive_mode(env: &Env) -> String {
    env.var("TELEMETRY_ARCHIVE_MODE")
        .ok()
        .map(|value| value.to_string().to_lowercase())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "daily".to_string())
}

async fn write_daily_archive_part(
    bucket: &Bucket,
    day: &str,
    part_index: usize,
    payload: String,
) -> Result<()> {
    let key = format!("{}/daily-{:03}.jsonl", day, part_index);

    bucket
        .put(&key, payload.into_bytes())
        .execute()
        .await
        .map_err(|e| {
            Error::RustError(format!(
                "Failed to write daily telemetry archive to R2: {:?}",
                e
            ))
        })?;

    console_log!("Telemetry daily archive written to R2: {}", key);
    Ok(())
}

async fn export_daily_archive_from_supabase(
    env: &Env,
    archive_day: chrono::NaiveDate,
) -> Result<()> {
    let bucket = match env.bucket("TELEMETRY_BUCKET") {
        Ok(bucket) => bucket,
        Err(error) => {
            console_log!(
                "TELEMETRY_BUCKET not configured, skipping daily Supabase archive export: {:?}",
                error
            );
            return Ok(());
        }
    };

    let supabase_url = match env.secret("SUPABASE_URL") {
        Ok(url) => url.to_string(),
        Err(_) => {
            console_log!("SUPABASE_URL not configured, skipping daily telemetry archive export");
            return Ok(());
        }
    };
    let supabase_key = match env.secret("SUPABASE_SERVICE_KEY") {
        Ok(key) => key.to_string(),
        Err(_) => {
            console_log!(
                "SUPABASE_SERVICE_KEY not configured, skipping daily telemetry archive export"
            );
            return Ok(());
        }
    };
    let table_name = env
        .var("SUPABASE_TELEMETRY_TABLE")
        .map(|value| value.to_string())
        .unwrap_or_else(|_| "telemetry_events".to_string());

    let day_key = archive_day.format("%Y%m%d").to_string();
    let range_start = archive_day.format("%Y-%m-%dT00:00:00Z").to_string();
    let range_end = (archive_day + chrono::Duration::days(1))
        .format("%Y-%m-%dT00:00:00Z")
        .to_string();

    let mut offset = 0usize;
    let page_size = 1000usize;
    let mut part_index = 1usize;
    let mut part_payload = String::new();
    let mut total_rows = 0usize;

    loop {
        let request_url = format!(
            "{}/rest/v1/{}?select=*&timestamp=gte.{}&timestamp=lt.{}&order=timestamp.asc,id.asc&limit={}&offset={}",
            supabase_url, table_name, range_start, range_end, page_size, offset
        );

        let headers = Headers::new();
        headers.set("apikey", &supabase_key)?;
        headers.set("Authorization", &format!("Bearer {}", supabase_key))?;
        headers.set("Accept", "application/json")?;

        let mut request_init = RequestInit::new();
        request_init.with_method(Method::Get).with_headers(headers);

        let request = Request::new_with_init(&request_url, &request_init)?;
        let mut response = Fetch::Request(request).send().await?;

        if response.status_code() < 200 || response.status_code() >= 300 {
            let error_text = response.text().await.unwrap_or_default();
            return Err(Error::RustError(format!(
                "Failed to read daily telemetry archive from Supabase: {} - {}",
                response.status_code(),
                error_text
            )));
        }

        let rows: Vec<serde_json::Value> = response.json().await?;
        if rows.is_empty() {
            break;
        }

        total_rows += rows.len();

        for row in rows {
            let serialized = serde_json::to_string(&row).map_err(|e| {
                Error::RustError(format!(
                    "Failed to serialize daily telemetry archive row for {}: {}",
                    day_key, e
                ))
            })?;

            let additional_len = if part_payload.is_empty() {
                serialized.len()
            } else {
                serialized.len() + 1
            };

            if !part_payload.is_empty()
                && part_payload.len() + additional_len > TELEMETRY_ARCHIVE_MAX_PART_BYTES
            {
                write_daily_archive_part(&bucket, &day_key, part_index, part_payload).await?;
                part_index += 1;
                part_payload = String::new();
            }

            if !part_payload.is_empty() {
                part_payload.push('\n');
            }
            part_payload.push_str(&serialized);
        }

        offset += page_size;
    }

    if !part_payload.is_empty() {
        write_daily_archive_part(&bucket, &day_key, part_index, part_payload).await?;
    }

    console_log!(
        "Daily telemetry archive export completed for {} with {} rows",
        day_key,
        total_rows
    );
    Ok(())
}

async fn handle_telemetry(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());
    let session = extract_viewer_session(&req, &ctx);

    let user_agent = req
        .headers()
        .get("User-Agent")?
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let ip_address = req
        .headers()
        .get("CF-Connecting-IP")?
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let region = req
        .cf()
        .and_then(|cf| cf.region())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    let visitor_id = session
        .as_ref()
        .map(|session| session.vid.clone())
        .or_else(|| extract_non_empty_header(&req, "X-Viewer-Visitor-Id"));
    let session_id = session
        .as_ref()
        .map(|session| session.sid.clone())
        .or_else(|| extract_non_empty_header(&req, "X-Viewer-Session-Id"));

    let batch: TelemetryBatch = match req.json().await {
        Ok(body) => body,
        Err(error) => {
            console_log!("Failed to parse telemetry batch: {:?}", error);
            return error_response_with_origin("INVALID_REQUEST", "Invalid JSON", 400, &origin);
        }
    };

    let has_auth = session.is_some() || has_access_token(&req, &ctx);

    if !has_auth {
        return error_response_with_origin(
            "UNAUTHORIZED",
            "Missing or invalid viewer session",
            401,
            &origin,
        );
    }

    let TelemetryBatch {
        events,
        flush,
        stream,
    } = batch;

    let enriched_events: Vec<EnrichedTelemetryEvent> = events
        .into_iter()
        .map(|event| EnrichedTelemetryEvent {
            fields: event.fields,
            metadata: TelemetryMetadata {
                user_agent: user_agent.clone(),
                ip_address: ip_address.clone(),
                region: region.clone(),
                visitor_id: visitor_id.clone(),
                session_id: session_id.clone(),
                stream: stream.clone(),
                received_at: Utc::now().to_rfc3339(),
            },
        })
        .collect();

    let ingest_result = {
        let mut buffer = TELEMETRY_BUFFER.write().expect("telemetry buffer poisoned");
        buffer.ingest(enriched_events, flush)
    };

    let status_code = match &ingest_result {
        TelemetryIngestResult::Noop => 204,
        TelemetryIngestResult::Buffered => 202,
        TelemetryIngestResult::Flush(_) => 202,
    };

    // Perform async flush if needed
    if let TelemetryIngestResult::Flush(events) = ingest_result {
        // PRIMARY: Insert into Supabase PostgreSQL
        let supabase_url = ctx.secret("SUPABASE_URL").ok();
        let supabase_key = ctx.secret("SUPABASE_SERVICE_KEY").ok();
        let table_name = ctx
            .var("SUPABASE_TELEMETRY_TABLE")
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "telemetry_events".to_string());

        if let (Some(url), Some(key)) = (supabase_url, supabase_key) {
            let url_str = url.to_string();
            let key_str = key.to_string();

            // Build payload for Supabase REST API
            let supabase_payload: Vec<serde_json::Value> = events
                .iter()
                .map(|event| {
                    let mut row = serde_json::json!({
                        "timestamp": event.fields.get("timestamp").and_then(|v| v.as_str()),
                        "feature": event.fields.get("feature").and_then(|v| v.as_str()),
                        "action": event.fields.get("action").and_then(|v| v.as_str()),
                        "value": event.fields.get("value").map(|v| match v {
                            serde_json::Value::String(s) => s.clone(),
                            _ => v.to_string(),
                        }),
                        "ym": event.fields.get("ym").and_then(|v| v.as_str()),
                        "url": event.fields.get("url").and_then(|v| v.as_str()),
                        "user_agent": event.metadata.user_agent.as_deref(),
                        "ip_address": event.metadata.ip_address.as_deref(),
                        "region": event.metadata.region.as_deref(),
                        "visitor_id": event.metadata.visitor_id.as_deref(),
                        "session_id": event.metadata.session_id.as_deref(),
                        "viewport_width": event.fields.get("viewport")
                            .and_then(|v| v.get("width"))
                            .and_then(|v| v.as_i64()),
                        "viewport_height": event.fields.get("viewport")
                            .and_then(|v| v.get("height"))
                            .and_then(|v| v.as_i64()),
                        "language": event.fields.get("language").and_then(|v| v.as_str()),
                        "timezone": event.fields.get("timezone").and_then(|v| v.as_str()),
                        "referrer": event.fields.get("referrer").and_then(|v| v.as_str()),
                        "stream": event.metadata.stream.as_deref(),
                    });

                    if let Some(release) = event
                        .fields
                        .get("schedule_viewer_release")
                        .and_then(|v| v.as_str())
                        .filter(|value| !value.trim().is_empty())
                    {
                        row.as_object_mut()
                            .expect("telemetry row is a JSON object")
                            .insert(
                                "schedule_viewer_release".to_string(),
                                serde_json::Value::String(release.trim().to_string()),
                            );
                    }

                    row
                })
                .collect();

            // Call Supabase REST API
            let supabase_insert_url = format!("{}/rest/v1/{}", url_str, table_name);

            // Serialize payload to JSON string
            if let Ok(payload_json) = serde_json::to_string(&supabase_payload) {
                let headers = Headers::new();
                if let (Ok(()), Ok(()), Ok(()), Ok(())) = (
                    headers.set("apikey", &key_str),
                    headers.set("Authorization", &format!("Bearer {}", key_str)),
                    headers.set("Content-Type", "application/json"),
                    headers.set("Prefer", "return=minimal"),
                ) {
                    let mut request_init = RequestInit::new();
                    request_init
                        .with_method(Method::Post)
                        .with_headers(headers)
                        .with_body(Some(payload_json.into()));

                    if let Ok(supabase_req) =
                        Request::new_with_init(&supabase_insert_url, &request_init)
                    {
                        match Fetch::Request(supabase_req).send().await {
                            Ok(mut response) => {
                                let status = response.status_code();
                                if status < 200 || status >= 300 {
                                    let error_text = response.text().await.unwrap_or_default();
                                    console_error!(
                                        "Supabase insert failed: {} - {}",
                                        status,
                                        error_text
                                    );
                                } else {
                                    console_log!(
                                        "Successfully inserted {} events to Supabase",
                                        events.len()
                                    );
                                }
                            }
                            Err(e) => {
                                console_error!("Supabase request failed: {:?}", e);
                            }
                        }
                    }
                }
            }
        } else {
            console_log!("Supabase credentials not configured, skipping Supabase insert");
        }

        // SECONDARY: Archive to R2 (existing logic)
        let r2_enabled = ctx
            .var("TELEMETRY_ARCHIVE_TO_R2")
            .ok()
            .and_then(|v| v.to_string().parse::<bool>().ok())
            .unwrap_or(true);

        if r2_enabled {
            let log_only = resolve_bool_var(&ctx.env, "TELEMETRY_LOG_ONLY", false);
            let archive_mode = resolve_telemetry_archive_mode(&ctx.env);

            if log_only {
                let _ = flush_events_to_storage(&events, None, true).await;
            } else if archive_mode == "daily" {
                console_log!(
                    "Telemetry archive deferred to daily Supabase export ({} events)",
                    events.len()
                );
            } else {
                let bucket = ctx.bucket("TELEMETRY_BUCKET").ok();
                let _ = flush_events_to_storage(&events, bucket.as_ref(), false).await;
            }
        }
    }

    let headers = build_cors_headers(&origin)?;
    Ok(Response::empty()?
        .with_headers(headers)
        .with_status(status_code))
}

async fn handle_feedback(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());

    // Check authentication
    if !has_access_token(&req, &ctx) {
        return error_response_with_origin(
            "UNAUTHORIZED",
            "Missing or invalid viewer session",
            401,
            &origin,
        );
    }

    // Extract metadata from request
    let user_agent = req
        .headers()
        .get("User-Agent")?
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty());
    let ip_address = req
        .headers()
        .get("CF-Connecting-IP")?
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty());
    let region = req
        .cf()
        .and_then(|cf| cf.region())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty());

    // Parse request body
    let feedback_req: FeedbackRequest = match req.json().await {
        Ok(body) => body,
        Err(error) => {
            console_log!("Failed to parse feedback request: {:?}", error);
            return error_response_with_origin("INVALID_REQUEST", "Invalid JSON", 400, &origin);
        }
    };

    // Validate feedback_text
    let trimmed_text = feedback_req.feedback_text.trim();
    if trimmed_text.is_empty() {
        return error_response_with_origin(
            "VALIDATION_ERROR",
            "Feedback text cannot be empty",
            400,
            &origin,
        );
    }
    if trimmed_text.len() > 1000 {
        return error_response_with_origin(
            "VALIDATION_ERROR",
            "Feedback text cannot exceed 1000 characters",
            400,
            &origin,
        );
    }

    // Validate signature (optional)
    let signature = feedback_req
        .signature
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    let now = Utc::now();
    let submitted_at = now.to_rfc3339();

    // Build enriched metadata
    let mut enriched_metadata = feedback_req.metadata.clone();
    enriched_metadata.insert("user_agent".to_string(), serde_json::json!(user_agent));
    enriched_metadata.insert("ip_address".to_string(), serde_json::json!(ip_address));
    enriched_metadata.insert("region".to_string(), serde_json::json!(region));
    enriched_metadata.insert("submitted_at".to_string(), serde_json::json!(submitted_at));

    // PRIMARY: Insert to Supabase
    let supabase_success = insert_feedback_to_supabase(
        &ctx,
        trimmed_text,
        signature.as_deref(),
        &enriched_metadata,
        &user_agent,
        &ip_address,
        &region,
        &submitted_at,
    )
    .await;

    if !supabase_success {
        console_error!("Failed to insert feedback to Supabase");
        return error_response_with_origin(
            "STORAGE_ERROR",
            "Failed to save feedback",
            500,
            &origin,
        );
    }

    // SECONDARY: Archive to R2 (best effort)
    let r2_enabled = ctx
        .var("FEEDBACK_ARCHIVE_TO_R2")
        .ok()
        .and_then(|v| v.to_string().parse::<bool>().ok())
        .unwrap_or(true);
    if r2_enabled {
        if let Ok(bucket) = ctx.bucket("FEEDBACK_BUCKET") {
            let _ = archive_feedback_to_r2(
                &bucket,
                trimmed_text,
                signature.as_deref(),
                &enriched_metadata,
            )
            .await;
        } else {
            console_log!("FEEDBACK_BUCKET not configured, skipping R2 archive");
        }
    }

    // Success response
    let response = FeedbackResponse {
        success: true,
        error: None,
    };
    let json = serde_json::to_string(&response)?;
    let headers = build_cors_headers(&origin)?;
    headers.set("Content-Type", "application/json")?;
    Ok(Response::ok(json)?.with_headers(headers))
}

async fn insert_feedback_to_supabase(
    ctx: &RouteContext<()>,
    feedback_text: &str,
    signature: Option<&str>,
    metadata: &JsonMap,
    user_agent: &Option<String>,
    ip_address: &Option<String>,
    region: &Option<String>,
    submitted_at: &str,
) -> bool {
    let supabase_url = match ctx.secret("SUPABASE_URL") {
        Ok(url) => url.to_string(),
        Err(_) => {
            console_log!("SUPABASE_URL not configured");
            return false;
        }
    };
    let supabase_key = match ctx.secret("SUPABASE_SERVICE_KEY") {
        Ok(key) => key.to_string(),
        Err(_) => {
            console_log!("SUPABASE_SERVICE_KEY not configured");
            return false;
        }
    };
    let table_name = ctx
        .var("SUPABASE_FEEDBACK_TABLE")
        .map(|v| v.to_string())
        .unwrap_or_else(|_| "feedback_submissions".to_string());

    let ym = metadata.get("ym").and_then(|v| v.as_str());
    let url = metadata.get("url").and_then(|v| v.as_str());

    let payload = serde_json::json!([{
        "feedback_text": feedback_text,
        "signature": signature,
        "metadata": metadata,
        "user_agent": user_agent,
        "ip_address": ip_address,
        "region": region,
        "url": url,
        "ym": ym,
        "submitted_at": submitted_at,
    }]);

    let insert_url = format!("{}/rest/v1/{}", supabase_url, table_name);
    let payload_json = match serde_json::to_string(&payload) {
        Ok(json) => json,
        Err(e) => {
            console_error!("Failed to serialize feedback payload: {:?}", e);
            return false;
        }
    };

    let headers = Headers::new();
    if let Err(e) = (|| -> Result<()> {
        headers.set("apikey", &supabase_key)?;
        headers.set("Authorization", &format!("Bearer {}", supabase_key))?;
        headers.set("Content-Type", "application/json")?;
        headers.set("Prefer", "return=minimal")?;
        Ok(())
    })() {
        console_error!("Failed to build Supabase headers: {:?}", e);
        return false;
    }

    let mut request_init = RequestInit::new();
    request_init
        .with_method(Method::Post)
        .with_headers(headers)
        .with_body(Some(payload_json.into()));

    let supabase_req = match Request::new_with_init(&insert_url, &request_init) {
        Ok(req) => req,
        Err(e) => {
            console_error!("Failed to create Supabase request: {:?}", e);
            return false;
        }
    };

    match Fetch::Request(supabase_req).send().await {
        Ok(mut response) => {
            let status = response.status_code();
            if status >= 200 && status < 300 {
                console_log!("Successfully inserted feedback to Supabase");
                true
            } else {
                let error_text = response.text().await.unwrap_or_default();
                console_error!("Supabase insert failed: {} - {}", status, error_text);
                false
            }
        }
        Err(e) => {
            console_error!("Supabase request failed: {:?}", e);
            false
        }
    }
}

async fn archive_feedback_to_r2(
    bucket: &Bucket,
    feedback_text: &str,
    signature: Option<&str>,
    metadata: &JsonMap,
) -> Result<()> {
    let now = Utc::now();
    let date_path = now.format("%Y%m%d").to_string();
    let uuid = uuid::Uuid::new_v4().to_string();
    let key = format!("{}/{}.json", date_path, uuid);

    let archive_payload = serde_json::json!({
        "feedback_text": feedback_text,
        "signature": signature,
        "metadata": metadata,
    });

    let json_bytes = serde_json::to_vec(&archive_payload)
        .map_err(|e| Error::RustError(format!("Failed to serialize R2 payload: {}", e)))?;

    bucket
        .put(&key, json_bytes)
        .execute()
        .await
        .map_err(|e| Error::RustError(format!("Failed to write to R2: {:?}", e)))?;

    console_log!("Feedback archived to R2: {}", key);
    Ok(())
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
    let headers = Headers::new();
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

fn transform_to_month_shifts(
    ym: String,
    shifts: Vec<UpstreamShift>,
    shift_display_config: &config::ShiftDisplayConfig,
) -> MonthShifts {
    // Extract unique people
    let mut people_map: HashMap<String, Person> = HashMap::new();
    let mut shift_codes: HashSet<String> = HashSet::new();
    let mut shift_names: HashMap<String, String> = HashMap::new();

    for shift in &shifts {
        let fname = shift.user.fname.as_deref().unwrap_or("Unknown");
        let lname = shift.user.lname.as_deref().unwrap_or("");

        let user_id = shift
            .user
            .id
            .map(|id| id.to_string())
            .unwrap_or_else(|| format!("{}_{}", fname, lname));
        people_map.entry(user_id.clone()).or_insert_with(|| Person {
            id: user_id.clone(),
            name: format!("{} {}", fname, lname).trim().to_string(),
        });

        // Extract shift code from alias (remove time portion)
        let code = extract_shift_code(&shift.shift.alias, shift_display_config);
        if !code.is_empty() {
            shift_codes.insert(code.clone());
            let resolved_label = shift_display_config.resolve_label(&code, &shift.shift.alias);
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

        let user_id = shift
            .user
            .id
            .map(|id| id.to_string())
            .unwrap_or_else(|| format!("{}_{}", fname, lname));
        if let Some(&person_idx) = person_indices.get(&user_id) {
            // Extract day from start_time (format: "YYYY-MM-DD HH:MM:SS")
            if let Some(day) = extract_day_from_datetime(&shift.start_time) {
                if day > 0 && day <= days_in_month {
                    let code = extract_shift_code(&shift.shift.alias, shift_display_config);
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

fn extract_shift_code(alias: &str, shift_display_config: &config::ShiftDisplayConfig) -> String {
    // Extract shift code from alias like "RATM 8:00AM - 2:00PM" -> "RATM"
    // or "FT 8:30am - 6:30" -> "FT"
    // Just take everything before the first space or digit and normalise using config
    let token = alias.split_whitespace().next().unwrap_or(alias).trim();

    let normalised = shift_display_config.normalize_token(token);
    if normalised.is_empty() {
        return token.to_string();
    }

    normalised
}

fn extract_non_empty_header(req: &Request, name: &str) -> Option<String> {
    req.headers()
        .get(name)
        .ok()
        .flatten()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn parse_cookies(req: &Request) -> HashMap<String, String> {
    let mut cookies = HashMap::new();
    let Ok(Some(cookie_header)) = req.headers().get("Cookie") else {
        return cookies;
    };

    for cookie in cookie_header.split(';') {
        let trimmed = cookie.trim();
        if let Some((name, value)) = trimmed.split_once('=') {
            let key = name.trim();
            let value = value.trim();
            if !key.is_empty() && !value.is_empty() {
                cookies.insert(key.to_string(), value.to_string());
            }
        }
    }

    cookies
}

fn resolve_cookie_name(name: &str, req: &Request) -> String {
    if req
        .url()
        .map(|url| url.scheme() == "https")
        .unwrap_or(false)
    {
        format!("__Host-{}", name)
    } else {
        name.to_string()
    }
}

fn read_cookie(req: &Request, name: &str) -> Option<String> {
    let cookies = parse_cookies(req);
    cookies
        .get(&resolve_cookie_name(name, req))
        .cloned()
        .or_else(|| cookies.get(name).cloned())
}

fn build_cookie(name: &str, value: &str, max_age_seconds: u64, req: &Request) -> String {
    let mut parts = vec![
        format!("{}={}", resolve_cookie_name(name, req), value),
        "Path=/".to_string(),
        "HttpOnly".to_string(),
        "SameSite=Lax".to_string(),
        format!("Max-Age={}", max_age_seconds),
    ];

    if req
        .url()
        .map(|url| url.scheme() == "https")
        .unwrap_or(false)
    {
        parts.push("Secure".to_string());
    }

    parts.join("; ")
}

fn build_expired_cookie(name: &str, req: &Request) -> String {
    build_cookie(name, "", 0, req)
}

fn append_cookie(headers: &Headers, cookie: &str) -> Result<()> {
    headers.append("Set-Cookie", cookie)
}

fn resolve_session_signing_secret(ctx: &RouteContext<()>) -> Option<String> {
    ctx.secret("SESSION_SECRET")
        .ok()
        .map(|secret| secret.to_string())
        .or_else(|| {
            ctx.secret("ACCESS_PASSWORD")
                .ok()
                .map(|secret| secret.to_string())
        })
}

fn resolve_session_ttl_seconds(ctx: &RouteContext<()>) -> u64 {
    ctx.var("SESSION_TTL_SECONDS")
        .ok()
        .and_then(|value| value.to_string().parse::<u64>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(DEFAULT_SESSION_TTL_SECONDS)
}

fn sign_viewer_session(claims: &ViewerSessionClaims, secret: &str) -> Result<String> {
    let payload = serde_json::to_vec(claims)
        .map(|json| URL_SAFE_NO_PAD.encode(json))
        .map_err(|e| Error::RustError(format!("Failed to encode session payload: {}", e)))?;

    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| Error::RustError("Invalid session secret".to_string()))?;
    mac.update(payload.as_bytes());
    let signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());

    Ok(format!("{}.{}", payload, signature))
}

fn verify_viewer_session(token: &str, secret: &str) -> Option<ViewerSessionClaims> {
    let (payload, signature) = token.split_once('.')?;
    let expected_signature = URL_SAFE_NO_PAD.decode(signature).ok()?;

    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).ok()?;
    mac.update(payload.as_bytes());
    mac.verify_slice(&expected_signature).ok()?;

    let decoded_payload = URL_SAFE_NO_PAD.decode(payload).ok()?;
    let claims: ViewerSessionClaims = serde_json::from_slice(&decoded_payload).ok()?;
    let now = Utc::now().timestamp();

    if claims.exp <= now || claims.sid.trim().is_empty() || claims.vid.trim().is_empty() {
        return None;
    }

    Some(claims)
}

fn extract_viewer_session(req: &Request, ctx: &RouteContext<()>) -> Option<ViewerSessionClaims> {
    let token = read_cookie(req, SESSION_COOKIE)?;
    let secret = resolve_session_signing_secret(ctx)?;
    verify_viewer_session(&token, &secret)
}

fn has_access_token(req: &Request, ctx: &RouteContext<()>) -> bool {
    extract_viewer_session(req, ctx).is_some()
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
    let headers = build_cors_headers(&origin)?;
    headers.set("Content-Type", "application/json")?;
    headers.set("Cache-Control", "no-store, must-revalidate")?;

    if !has_access {
        append_cookie(&headers, &build_expired_cookie(SESSION_COOKIE, &req))?;
        append_cookie(&headers, &build_expired_cookie(LEGACY_ACCESS_COOKIE, &req))?;
    }

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
            return error_response_with_origin(
                "CONFIG_ERROR",
                "Password not configured",
                500,
                &origin,
            );
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
        let headers = build_cors_headers(&origin)?;
        headers.set("Content-Type", "application/json")?;
        headers.set("Cache-Control", "no-store, must-revalidate")?;

        return Ok(Response::error(json, 401)?.with_headers(headers));
    }

    let visitor_id =
        read_cookie(&req, VISITOR_COOKIE).unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = Utc::now().timestamp();
    let session_ttl_seconds = resolve_session_ttl_seconds(&ctx);
    let session_exp = now + session_ttl_seconds as i64;
    let session_secret = resolve_session_signing_secret(&ctx)
        .ok_or_else(|| Error::RustError("Session signing secret is not configured".to_string()))?;
    let session_token = sign_viewer_session(
        &ViewerSessionClaims {
            sid: uuid::Uuid::new_v4().to_string(),
            vid: visitor_id.clone(),
            iat: now,
            exp: session_exp,
        },
        &session_secret,
    )?;

    let response = AccessResponse {
        success: true,
        error: None,
        token: None,
    };

    let json = serde_json::to_string(&response)?;
    let headers = build_cors_headers(&origin)?;
    headers.set("Content-Type", "application/json")?;
    headers.set("Cache-Control", "no-store, must-revalidate")?;
    append_cookie(
        &headers,
        &build_cookie(SESSION_COOKIE, &session_token, session_ttl_seconds, &req),
    )?;
    append_cookie(
        &headers,
        &build_cookie(
            VISITOR_COOKIE,
            &visitor_id,
            VISITOR_COOKIE_TTL_SECONDS,
            &req,
        ),
    )?;
    append_cookie(&headers, &build_expired_cookie(LEGACY_ACCESS_COOKIE, &req))?;

    Ok(Response::ok(json)?.with_headers(headers))
}

fn handle_options_with_origin(req: &Request) -> Result<Response> {
    // Get origin from request, default to * if not present
    let origin = req
        .headers()
        .get("Origin")?
        .unwrap_or_else(|| "*".to_string());

    let headers = build_cors_headers(&origin)?;

    Ok(Response::empty()?.with_headers(headers).with_status(204))
}

fn build_cors_headers(origin: &str) -> Result<Headers> {
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", origin)?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    )?;
    headers.set("Access-Control-Allow-Credentials", "true")?;
    headers.set("Access-Control-Max-Age", "86400")?;
    Ok(headers)
}

fn error_response(code: &str, message: &str, status: u16) -> Result<Response> {
    error_response_with_origin(code, message, status, "*")
}

fn error_response_with_origin(
    code: &str,
    message: &str,
    status: u16,
    origin: &str,
) -> Result<Response> {
    let error = ApiError {
        error: ErrorDetails {
            code: code.to_string(),
            message: message.to_string(),
        },
    };

    let json = serde_json::to_string(&error)?;
    let headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", origin)?;
    headers.set("Access-Control-Allow-Credentials", "true")?;

    Ok(Response::error(json, status)?.with_headers(headers))
}
