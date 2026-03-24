# Batch 470 - Modal FormData Payload Normalization

## What changed
- Added `normalizeCrudFormFieldValue(entityType, key, value)` to normalize modal FormData field values before CRUD calls:
  - applies baseline sanitization for all fields,
  - coerces `release.year` to bounded integer (`1900..9999`) when numeric,
  - canonicalizes `event.date` via `normalizeIsoDateFilter(...)` with sanitized fallback.
- Added `buildCrudItemFromFormData(entityType, formData, baseItem)` helper to assemble CRUD payload object from FormData using centralized field normalization.
- Updated modal submit handler to use `buildCrudItemFromFormData(...)` instead of ad-hoc `formData.forEach(...)` assignment.

## Why
- Centralizes FormData-to-payload normalization in one place for safer and more predictable CRUD submission behavior.
- Reduces type drift in key fields (`year`, `date`) while preserving existing modal flow and adapter contract.
- Keeps behavior-preserving hardening strategy consistent with previous normalization batches.

## Validation
- Diagnostics check for `admin.js`: no errors found.
