# Changelog 2026-04-17 #25 - UI smoke admin password source alignment

## Як було

- У `scripts/ui-smoke.mjs` повторна перевірка адмін-персистентності (`verifyAdminPersistence`) викликала логін через `readAdminPasswordFromBackendEnv() || "core64admin"`.
- На CI це могло розходитись з фактичним секретом `CORE64_ADMIN_PASSWORD`, який вже використовувався на старті `ui-smoke`.
- Як наслідок, у середині сценарію виникали `401 Unauthorized` під час завантаження/збереження settings.

## Що зроблено

- У `scripts/ui-smoke.mjs` змінено сигнатуру `verifyAdminPersistence`:
- додано явний параметр `adminPassword`.
- Повторний логін у `verifyAdminPersistence` тепер використовує той самий `adminPassword`, що й основний вхід у `run()`.
- Оновлено виклик `verifyAdminPersistence` у `run()` з передачею `adminPassword`.

## Що покращило/виправило/додало

- Прибрано розсинхрон джерел пароля в межах одного `ui-smoke` запуску.
- Зменшено ризик флейкових `401 Unauthorized` у кроці `Run UI smoke` через fallback на `core64admin` у CI.
- Поведінка smoke-сценарію стала детермінованішою для секретів, що задаються тільки через workflow env/secrets.
