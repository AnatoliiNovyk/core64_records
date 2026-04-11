# 2026-04-11-10 Home Hero Logo Upload Only

## Previous state
- The main Home hero brand area was hardcoded as text and could not be replaced with an image from admin settings.
- There was no dedicated settings field for Home hero main logo.
- Existing logo fields in settings allowed URL/path style values, which does not satisfy strict upload-only requirements for this Home hero logo use case.

## What was changed
- Added DB support for a dedicated Home hero logo field:
  - backend/src/db/migrations/015_settings_hero_main_logo_data_url.sql
  - new settings column: hero_main_logo_data_url
- Extended backend validation and persistence:
  - backend/src/middleware/validate.js: new settings field heroMainLogoDataUrl with strict validation (only image data URL or empty value)
  - backend/src/db/repository.js: read/write mapping for heroMainLogoDataUrl in settings select/insert/update paths
  - backend/src/utils/settingsAuditDiff.js: included heroMainLogoDataUrl in tracked settings fields
- Extended admin settings UI and logic for upload-only flow:
  - admin.html: added dedicated Home hero logo upload block (file input + preview + hidden value), with no URL input
  - admin.js: added i18n labels/hints, hero-main upload wiring, preview updates, settings load/save integration, and pre-save guard against non-data URL tampering
- Extended public Home rendering:
  - index.html: added hero image element placeholder and explicit fallback heading id
  - app.js: added logic to render hero main logo from settings.heroMainLogoDataUrl (data URL only), with automatic fallback to existing heading text when missing/invalid
- Extended local fallback defaults:
  - data-adapter.js: added heroMainLogoDataUrl to default settings payload

## Resulting improvement
- Admin can now replace the main Home hero visual using image upload directly from local computer.
- For this new Home hero logo field, URL links are blocked by backend contract and frontend guard, enforcing upload-only behavior.
- Public page now supports dynamic hero logo image rendering with safe fallback to the original text heading.
