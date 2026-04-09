# 2026-04-09-30 Observability Structured Request Error Logging

## Як було
- Backend запускався з поодинокими `console.log/console.error` без єдиного формату подій.
- Запити API не мали стабільного структурованого access-log із requestId та latency.
- Для payload логів не було централізованого self-test, який гарантує редагування чутливих полів.

## Що зроблено
- Додано санітизований structured logger у backend та підключено його до startup/error-потоку.
- Додано middleware логування API-запитів з `requestId`, `statusCode`, `durationMs`, шляхом і базовим контекстом клієнта.
- Розширено backend config новими env-параметрами `LOG_LEVEL`, `REQUEST_LOGGING_ENABLED`, `REQUEST_LOGGING_MAX_BODY_CHARS` з валідацією.
- Додано self-test `scripts/test-log-sanitizer.mjs` для перевірки redaction/truncation/data-url/depth/error санітизації.
- Підключено новий self-test у локальний pre-release gate і CI workflow, оновлено документацію gate.

## Що покращило/виправило/додало
- Логи backend стали машинно-читабельними та придатними для кореляції інцидентів по `requestId`.
- Ризик витоку секретів у логах зменшено завдяки централізованій санітизації та gate-перевірці.
- Діагностика прод/стейдж інцидентів прискорилась за рахунок стабільних полів подій і вимірювання latency.
