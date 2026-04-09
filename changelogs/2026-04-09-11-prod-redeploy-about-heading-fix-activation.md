# 2026-04-09-11 Prod Redeploy About Heading Fix Activation

## Як було
- На проді `core64.pp.ua` API вже повертав актуальне `settings.title` (`CORE64 Records Label`), але публічна сторінка About лишалась зі старим заголовком.
- У прод-HTML не було маркера `id="public-section-title-about"`, а прод `app.js` не містив прив'язки About heading до `settings.title`.
- Додатково локальна `main` була `ahead 3` від `origin/main`, тому деплойні збірки з GitHub не включали останній фікс.

## Що зроблено
- Запушено локальні коміти у `origin/main` (включно з фіксом паритету About heading).
- Запущено `deploy-google-run.yml` через GitHub REST API на `head_sha=03f1e2f...`.
- Перший запуск впав на валідації GCP ресурсів через невірний `artifact_repo`; виконано повторний dispatch з `artifact_repo=core64`.
- Другий запуск workflow завершився успішно: `actions/runs/24165897052`.
- Підтверджено прод-стан після деплою:
  - `PROD_HTML_MARKER=HAS_ID`
  - `APP_JS_HAS_ABOUT_ID_BINDING=True`
  - `APP_JS_HAS_SETTINGS_TITLE=True`
  - браузерна перевірка DOM: `ABOUT_HEADING=CORE64 Records Label`

## Що покращило/виправило/додало
- Відновлено відповідність між Label Name в адмінці та фактичним заголовком About на проді.
- Усунуто дрейф між API-даними та публічним фронтенд-артефактом у прод-середовищі.
- Зафіксовано робочий операційний шлях швидкого відновлення через workflow dispatch з коректним `artifact_repo`.
