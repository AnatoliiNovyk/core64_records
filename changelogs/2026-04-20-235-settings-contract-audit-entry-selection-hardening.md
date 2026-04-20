## Як було
- Скрипт [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs) після `PUT /settings` обирав перший запис audit із `details.source=/settings`.
- За наявності паралельних/сторонніх оновлень settings цей перший запис міг не відповідати саме контрактному апдейту поточного прогона.
- Через це pre-release gate міг падати false-negative з помилкою `Settings audit diff entry is missing or malformed after PUT /settings`.

## Що зроблено
- У [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs) додано більш надійний вибір audit-кандидата:
  - введено оцінку кандидатів за `hasStructuredChanges`, повнотою `REQUIRED_AUDIT_SETTINGS_FIELDS`, наявністю marker у `changes.*.after` і близькістю `created_at` до часу `PUT /settings`;
  - вибір виконується не за першим записом, а за найкращим валідним кандидатом;
  - додано короткий poll audit-логів (до 3 спроб) для зниження ризику флейку;
  - додано діагностичні поля у `report.checks.auditSettingsUpdated` (`markerMatched`, `nearPutWindow`, `auditPollAttempts`).
- Проведено локальну валідацію:
  - `node --check scripts/settings-public-contract-check.mjs`;
  - `npm run contract-check:settings-public` (із локально піднятим backend) — passed.

## Що покращило/виправило/додало
- Усунено флейковість контрактного кроку для audit-diff після `PUT /settings`.
- Перевірка залишилась строгою до структури diff, але стала стійкою до сторонніх записів у top audit list.
- Додано кращу діагностику при потенційних падіннях у CI/workflow.
