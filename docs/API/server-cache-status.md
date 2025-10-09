# Server Cache Status

This document summarizes the current server-side cache implementation that backs the `/api/shifts` endpoint exposed by the Cloudflare Worker (`worker/src/lib.rs`).

## Overview

* The cache is an in-memory `RwLock<HashMap<String, CachedSchedule>>` stored in the worker process (`SCHEDULE_CACHE`). Each entry is keyed by the requested `ym` (year-month) parameter and contains the serialized response payload and the `fetched_at` timestamp.
* Cache lifetime is controlled by the `CACHE_TTL_SECONDS` environment variable. The worker defaults to `900` seconds if the variable cannot be parsed, while the local `wrangler.toml` sets it to `300` seconds for development.

## Request Flow

1. When the worker receives a `/api/shifts` request it validates input and resolves the month boundaries.
2. `get_cached_schedule` checks the in-memory cache. A cached entry is considered valid if its age is **strictly less** than the configured TTL. Requests with `CACHE_TTL_SECONDS=0` bypass the cache entirely.
3. Cache hits return immediately through `build_success_response`, which sets `X-Cache-Status: HIT` and a public `Cache-Control` header that mirrors the TTL (with a minimum of 1 second).
4. Cache misses fetch data from the upstream MetricAid API, serialize the transformed payload, store it via `store_schedule_in_cache`, and respond with `X-Cache-Status: MISS`.
5. Expired entries are removed from the cache the next time they are inspected.

## Additional Observations

* Revalidation happens opportunistically: entries expire only when a new request for the same `ym` arrives after the TTL window. There is no proactive eviction.
* The worker maintains cache state per-process. Cold starts or scaling events begin with an empty cache.
* Setting `CACHE_TTL_SECONDS` to zero effectively disables server-side caching while still returning a `Cache-Control` header of `max-age=1` for the response.
