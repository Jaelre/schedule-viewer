# Worker Password Gate Reference

This document describes the password-protected access flow implemented by the
Cloudflare Worker and the Next.js frontend. It summarizes the current behavior
so new contributors can understand how the worker, token, and client interact.

## Overview

The worker exposes three public endpoints that the frontend uses to authenticate
users and fetch schedules:

```
┌─────────┐     ┌──────────────────┐     ┌──────────┐
│ Browser │────▶│ Rust Worker      │────▶│ MetricAid│
│         │◀────│ /api/access      │◀────│   API    │
└─────────┘     │ /api/check-access│     └──────────┘
                │ /api/shifts      │
                └──────────────────┘
```

All password validation and MetricAid API proxying live inside the worker
(`worker/src/lib.rs`). The Next.js app ships as static pages and relies on
client-side logic (`src/app/_components/PasswordGate.tsx`) to request worker
endpoints.

## Worker endpoints

### `POST /api/access`
* Source: [`handle_access`](../worker/src/lib.rs)
* Accepts a JSON body `{ "password": "…" }`.
* Reads the expected password from the `ACCESS_PASSWORD` secret.
* Uses `constant_time_eq` to compare the provided password and secret without
  leaking timing information.
* On success returns `{ success: true, token: <password> }`. The password itself
  serves as a bearer token for later requests.
* On failure returns a 401 with `{ success: false, error: "…" }` and no token.
* Always mirrors the `Origin` header in CORS responses and sets
  `Access-Control-Allow-Credentials: true` so the browser may store the token.

### `GET /api/check-access`
* Source: [`handle_check_access`](../worker/src/lib.rs)
* Expects an `Authorization: Bearer <token>` header.
* Re-uses the same constant-time comparison against `ACCESS_PASSWORD`.
* Responds with `{ success: true }` or `{ success: false }`, allowing the
  frontend to verify that the stored token is still valid.

### `GET /api/shifts`
* Source: [`handle_shifts`](../worker/src/lib.rs)
* Requires a valid `ym=YYYY-MM` query parameter.
* Validates the incoming token with the same helper used by
  `/api/check-access`; invalid tokens receive `401 UNAUTHORIZED`.
* On success fetches schedule data from the upstream MetricAid API using the
  configured `API_BASE_URL`, `API_TOKEN`, timeout, and caching settings, then
  reshapes the data for the frontend.

## Token lifecycle

1. The user submits the password to `/api/access`.
2. The worker responds with the password as a token when the credential is
   correct.
3. The frontend stores the token in `localStorage` (`schedule_viewer_token`).
4. Subsequent requests add an `Authorization: Bearer <token>` header.
5. The worker validates the header for both `/api/check-access` and
   `/api/shifts`.
6. If validation fails, the frontend clears the stored token and prompts for the
   password again.

Because the password is never embedded in the static site, revoking or rotating
access only requires updating the `ACCESS_PASSWORD` secret on the worker.

## Frontend interaction

The [`PasswordGate` component](../src/app/_components/PasswordGate.tsx):

* Runs entirely on the client (`'use client'`).
* On mount, reads `localStorage` and calls `/api/check-access` to validate the
  stored token before showing protected content.
* Presents a password form when no valid token exists. Successful submissions
  store the token in `localStorage` and reveal the gated children.
* Shows loading and error states while awaiting worker responses.

All other pages wrap their content in `<PasswordGate>` so the same logic applies
throughout the application.

## Configuration summary

* **Worker secrets**: `ACCESS_PASSWORD`, `API_BASE_URL`, `API_TOKEN`, and other
  runtime configuration live in the worker environment.
* **Frontend environment**: `NEXT_PUBLIC_API_URL` points to the worker origin
  (e.g. `https://<worker>.workers.dev/api`). When omitted, the client defaults to
  relative `/api/*` paths.
* **CORS**: The worker reflects the request `Origin` header and enables
  credentials, allowing authenticated fetches from the static site domain.

Use this document as a reference when updating either the worker or the
frontend components to ensure the password gate remains consistent.
