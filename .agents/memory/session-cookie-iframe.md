---
name: Session cookie in Replit preview iframe
description: Why admin login broke in the Replit workspace preview and how it was fixed.
---

## The problem

The Replit workspace embeds the app in an iframe whose top-level origin is `replit.com`, while the app runs on `*.replit.dev`. Browsers treat this as a **cross-site** context.

Three layered issues:

1. **SameSite=Lax blocked the cookie in the iframe.** Login (POST) created a session and returned `Set-Cookie`, but subsequent requests from the iframe (different top-level origin) did not send the cookie back. Server returned `{"admin":null}` every time.

2. **Express ETag / 304 stale cache.** The initial unauthenticated `/api/auth/me` response (`{"admin":null}`) was cached by the browser with an ETag. Even after a session was established, the browser sent `If-None-Match` and received a 304, serving the stale null response.

3. **React state timing.** A `navigate()` call after `setAdmin()` could render `AdminGuard` before the state update was committed.

## Fixes applied

| Layer | Fix |
|-------|-----|
| Cookie | `SameSite=None; Secure=true` on the session cookie (requires `trust proxy: 1` since Replit proxy terminates TLS) |
| Server cache | `res.setHeader("Cache-Control", "no-store")` in the `/api/auth/me` route handler |
| Client cache | `cache: "no-store"` in the fetch options for `api.me()` calls — this is the most reliable fix; it tells the browser never to use a cached response, bypassing ETag/304 entirely |

**Why:** The client-side `cache: "no-store"` fetch option prevents the browser from ever sending a conditional `If-None-Match` request for `/auth/me`. Without it, even with server-side `Cache-Control: no-store`, the browser may still use old cache entries for ETag validation.

## Where to apply

- `artifacts/api-server/src/app.ts` — session cookie config
- `artifacts/api-server/src/routes/auth.ts` — `Cache-Control: no-store` on `/me`
- `artifacts/ayyappan-temple/src/lib/api.ts` — `cache: "no-store"` on `api.me()`

## Rule for future session-gated endpoints

Any endpoint whose response changes based on session state must have both:
1. Server: `Cache-Control: no-store`
2. Client: `{ cache: "no-store" }` in the fetch options
