# Batch 496 - Social URL normalization and YouTube hero link fix

## Summary
- Fixed social URL handling so settings no longer HTML-escape URL values before save.
- Added robust URL normalization/decoding for hero social links on the public frontend.
- Added a YouTube-specific normalization rule: `music.youtube.com/@handle` is normalized to `www.youtube.com/@handle`.

## Files changed
- admin.js
- app.js

## Root cause
- URL fields were passed through text sanitization intended for HTML content, which escaped characters like `&` into HTML entities (`&amp;`). This can break URL query strings and lead to invalid links.

## What changed
- Admin save flow now uses URL normalization for social settings fields:
  - decode known HTML entities
  - trim and normalize protocol
  - allow only `http` / `https`
  - fallback to `#` when invalid
- Public hero link binding now normalizes and decodes incoming settings URLs before assigning `href`.

## Impact
- YouTube and other hero social links now open correctly with normalized URLs.
- Existing escaped URLs from previously saved settings are handled safely by frontend normalization.
