# 2026-04-09-17 Structured Settings Audit Diff Trail

## Як було
- Оновлення settings (`PUT /settings`, `PUT /settings/sections`, `PUT /settings/bundle`) не формували структурований audit trail по змінених полях.
- В audit-логах був тільки кейс зміни статусу звернень (`contact_request status_updated`), без детального diff по налаштуваннях.
- Контрактний сценарій [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs) не перевіряв, що після `PUT /settings` з'являється валідний settings audit запис.

## Що зроблено
- Додано новий utility [backend/src/utils/settingsAuditDiff.js](backend/src/utils/settingsAuditDiff.js):
  - `buildSettingsDiff(previousSettings, nextSettings)` з полями `changedCount`, `changedFields`, `changes`, `redactedFields`;
  - `buildSectionSettingsDiff(previousSections, nextSections)` з `orderChanged`, `added/removed/updated`, `changedRowCount`, `changedFieldCount`;
  - чутливі ключі (`contactCaptchaHcaptchaSecretKey`, `contactCaptchaRecaptchaSecretKey`) редагуються як `[REDACTED]` у diff.
- Оновлено [backend/src/routes/settings.js](backend/src/routes/settings.js):
  - після успішного `PUT /settings` пишеться audit запис `action=settings_updated` з `details.diff.settings`;
  - після `PUT /settings/sections` пишеться `action=section_settings_updated` з `details.diff.sections`;
  - після `PUT /settings/bundle` пишеться `action=settings_bundle_updated` з комбінованим `details.diff.{settings,sections}`;
  - actor береться з `req.user.username`.
- Розширено [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs):
  - додано перевірку `GET /audit-logs?...action=settings_updated&entity=settings`;
  - додано асерти, що settings-audit запис існує, має `source=/settings`, `changedCount>0` і структурований diff з очікуваними changed fields.

## Що покращило/виправило/додало
- З'явився прозорий структурований аудит змін settings/sections з field-level деталізацією.
- Секретні captcha ключі не витікають у аудит (редакція в diff).
- Контрактний gate тепер не лише перевіряє parity settings/public, а й гарантує наявність та формат audit-diff після settings update.
