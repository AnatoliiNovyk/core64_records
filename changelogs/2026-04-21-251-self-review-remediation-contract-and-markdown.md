# 2026-04-21-251 Self-Review Remediation Contract and Markdown

## Як було

- Після самоперевірки залишався drift між body limit backend (25mb) і schema-лімітом `releaseTrack.audioDataUrl` (30000000 символів).
- README описував runtime API override без уточнення нових security-обмежень (allowlist + explicit enable).
- Нові changelog-файли 249 і 250 не відповідали markdown-правилам (перший рядок, blank lines навколо headings/lists).

## Що зроблено

- У `backend/src/middleware/validate.js` додано безпечний schema-ліміт `RELEASE_TRACK_REQUEST_SAFE_MAX_CHARS = 24_000_000` і застосовано його для create/update release track payload.
- У `README.md` уточнено контракт runtime API override: потрібні `allowQueryApiBaseOverride=true` та origin у `apiBaseOverrideAllowlist`, із суворими production default-обмеженнями.
- Виправлено markdown-структуру changelog-файлів 249 і 250: додано top-level H1 та коректні blank lines.

## Що покращило/виправило/додало

- Знято контрактний розрив між schema-очікуванням і фактичним body-parser обмеженням.
- Усунуто неоднозначність документації щодо безпечного режиму runtime API override.
- Прибрано markdown-lint помилки у changelog-артефактах цього батчу.
