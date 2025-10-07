use futures::future::{select, Either};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::time::Duration;
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

// Frontend types (MonthShifts contract)
#[derive(Serialize)]
struct MonthShifts {
    ym: String,
    people: Vec<Person>,
    rows: Vec<Vec<Option<String>>>,
    codes: Vec<String>,
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
    name: String,
    abbreviation: Option<String>,
}

#[derive(Deserialize)]
struct UserDetails {
    id: u64,
    first_name: String,
    last_name: String,
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
        return handle_options();
    }

    // Router
    let router = Router::new();
    router
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

    // Build upstream URL
    let upstream_url = format!(
        "{}/public/schedule?startDate={}&endDate={}&scheduleVersion=live",
        config.api_base_url, start_date, end_date
    );

    let auth_headers = vec![
        (
            "Authorization".to_string(),
            format!("Bearer {}", config.api_token),
        ),
    ];

    // Fetch from upstream API with timeout and retry
    let upstream_data = match fetch_with_retry(
        &upstream_url,
        config.api_timeout_ms,
        2,
        Some(auth_headers.as_slice()),
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
    let month_shifts = transform_to_month_shifts(ym, upstream.data);

    // Build response with caching
    let json = serde_json::to_string(&month_shifts)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set(
        "Cache-Control",
        &format!("public, max-age={}", config.cache_ttl_seconds),
    )?;
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Vary", "Origin")?;

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
            .unwrap_or(300),
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
    timeout_ms: u64,
    max_retries: u32,
    headers: Option<&[(String, String)]>,
) -> Result<String> {
    let mut retries = 0;
    let timeout_duration = Duration::from_millis(timeout_ms);

    loop {
        let controller = AbortController::new()?;
        let signal = controller.signal();

        let mut request_init = RequestInit::new();
        request_init.with_method(Method::Get);
        request_init.with_signal(Some(signal));

        let mut request = Request::new_with_init(url, &request_init)?;

        if let Some(headers) = headers {
            let request_headers = request.headers_mut();
            for (name, value) in headers {
                request_headers.set(name, value)?;
            }
        }

        let timeout_future = Delay::from(timeout_duration);
        let fetch_future = Fetch::Request(request).send();

        match select(timeout_future, fetch_future).await {
            Either::Left((_, mut pending_fetch)) => {
                controller.abort();
                let _ = pending_fetch.await;

                if retries < max_retries {
                    retries += 1;
                    continue;
                }

                return Err(Error::RustError(UPSTREAM_TIMEOUT_MESSAGE.to_string()));
            }
            Either::Right((fetch_result, _)) => match fetch_result {
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
            },
        }
    }
}

fn transform_to_month_shifts(ym: String, shifts: Vec<UpstreamShift>) -> MonthShifts {
    // Extract unique people
    let mut people_map: HashMap<String, Person> = HashMap::new();
    let mut shift_codes: HashSet<String> = HashSet::new();

    for shift in &shifts {
        let user_id = shift.user.id.to_string();
        people_map.entry(user_id.clone()).or_insert_with(|| Person {
            id: user_id.clone(),
            name: format!("{} {}", shift.user.first_name, shift.user.last_name),
        });

        // Use abbreviation if available, otherwise use full name
        let code = shift
            .shift
            .abbreviation
            .clone()
            .unwrap_or_else(|| shift.shift.name.clone());
        if !code.is_empty() {
            shift_codes.insert(code);
        }
    }

    // Sort people by ID for consistency
    let mut people: Vec<Person> = people_map.values().cloned().collect();
    people.sort_by(|a, b| a.id.cmp(&b.id));

    // Get days in month
    let days_in_month = get_days_in_month(&ym);

    // Build rows matrix (people x days)
    let mut rows: Vec<Vec<Option<String>>> = vec![vec![None; days_in_month]; people.len()];

    // Create person_id -> index mapping
    let person_indices: HashMap<String, usize> = people
        .iter()
        .enumerate()
        .map(|(i, p)| (p.id.clone(), i))
        .collect();

    // Fill in the matrix
    for shift in shifts {
        let user_id = shift.user.id.to_string();
        if let Some(&person_idx) = person_indices.get(&user_id) {
            // Extract day from start_time (format: "YYYY-MM-DD HH:MM:SS")
            if let Some(day) = extract_day_from_datetime(&shift.start_time) {
                if day > 0 && day <= days_in_month {
                    let code = shift.shift.abbreviation.unwrap_or(shift.shift.name);
                    rows[person_idx][day - 1] = Some(code);
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

fn handle_options() -> Result<Response> {
    let mut headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type")?;
    headers.set("Access-Control-Max-Age", "86400")?;

    Ok(Response::empty()?.with_headers(headers).with_status(204))
}

fn error_response(code: &str, message: &str, status: u16) -> Result<Response> {
    let error = ApiError {
        error: ErrorDetails {
            code: code.to_string(),
            message: message.to_string(),
        },
    };

    let json = serde_json::to_string(&error)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", "*")?;

    Ok(Response::error(json, status)?.with_headers(headers))
}
