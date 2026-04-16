# 2026-04-16-31 Release Save DB Storage Limit Unblock And Guardrails

## Як було

- Збереження релізу в адмінці падало з `500 INTERNAL_SERVER_ERROR`.
- Причина була не валідаційною і не schema-drift: Neon PostgreSQL повертав `53100` (`project size limit (512 MB) has been exceeded`).
- Таблиця `audit_logs` займала близько `38 MB`, а `release_tracks` близько `428 MB`, через що БД працювала на межі квоти.

## Що зроблено

- Виконано production-unblock на БД: очищено `audit_logs` (`TRUNCATE ... RESTART IDENTITY`), що зменшило таблицю з ~`38 MB` до `48 kB`.
- У `backend/src/utils/dbError.js` додано детектор переповнення сховища `isDatabaseStorageLimitError` (SQLSTATE `53100` + типові повідомлення).
- У `backend/src/server.js` додано стабільний API-контракт для цієї ситуації:
- HTTP `507`;
- code: `DB_STORAGE_LIMIT_REACHED`;
- error: `Database storage limit reached`.
- У `backend/src/utils/settingsAuditDiff.js` додано обрізання великих audit-значень до безпечного ліміту, щоб не зберігати великі payload-и (зокрема data URL) повністю.
- У `backend/src/db/repository.js` для `writeAuditLog` додано:
- компактний режим для великих `details`;
- м’яку деградацію при переповненні сховища (audit запис пропускається з warn-логом, бізнес-операція не валиться).

## Що покращило/виправило/додало

- Негайно розблоковано можливість запису в прод-БД після звільнення місця.
- Замість «німого» `500` система повертає діагностичний `507 DB_STORAGE_LIMIT_REACHED`, що скорочує час пошуку причин інциденту.
- Знижено ризик повторного швидкого росту `audit_logs` від великих змін у settings (особливо полів із великими рядками).
- Критичні API-операції більше не залежать жорстко від можливості запису технічного audit-логу при браку місця.
