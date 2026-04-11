# 2026-04-11-09 HTML Entrypoints No Cache

## Previous state
- Browser sessions could keep stale HTML entrypoints after deployment updates.
- In this state, users could see outdated frontend layout behavior (including old button placement) even when latest code was already deployed.
- Cache-busting on JS alone reduced the risk, but stale HTML could still delay full UI refresh.

## What was changed
- Updated backend/src/server.js static serving behavior:
  - Added express.static setHeaders hook to set no-cache headers for HTML entrypoints:
    - index.html
    - admin.html
  - Added explicit no-cache headers for route-based sendFile handlers:
    - GET /
    - GET /admin
- Applied headers:
  - Cache-Control: no-store, no-cache, must-revalidate
  - Pragma: no-cache
  - Expires: 0

## Resulting improvement
- Clients fetch fresh HTML entrypoints instead of reusing stale cached pages.
- Frontend updates (including floating button behavior) become visible more reliably after deploy.
- Reduced risk of UI mismatch where server is updated but browser still renders old markup.
