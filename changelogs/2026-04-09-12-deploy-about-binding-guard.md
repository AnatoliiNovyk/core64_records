# 2026-04-09-12 Deploy About Binding Guard

## Як було
- Після успішного деплою не було окремої автоматичної перевірки, що публічний фронтенд дійсно містить маркер About-заголовка і актуальну JS-прив'язку.
- Через це дрейф між API та публічним артефактом міг виявлятись лише вручну (після відкриття сторінки).

## Що зроблено
- Додано скрипт [scripts/check-public-about-binding.mjs](scripts/check-public-about-binding.mjs), який:
  - читає публічний origin із `--public-url`, `CORE64_PUBLIC_URL` або `CORS_ORIGIN`;
  - перевіряє в `index` наявність `id="public-section-title-about"`;
  - перевіряє в `app.js` наявність селектора `public-section-title-about` і прив'язки до `settings.title`;
  - повертає структурований JSON-звіт і завершується з `exit 1` при провалі.
- У [deploy-google-run.yml](.github/workflows/deploy-google-run.yml) додано крок `Post-deploy public About binding guard` після `Post-deploy smoke check`:
  - виконується лише за умови `run_post_deploy_smoke == true`;
  - запускає новий скрипт на public origin.
- Порядок кроків налаштовано так, щоб при падінні guard спрацьовував існуючий diagnostic-крок.

## Що покращило/виправило/додало
- Деплой-пайплайн тепер автоматично ловить регресію, коли прод-сторінка віддає застарілий About-біндінг.
- Зменшено ризик тихого прод-дрейфу між статичним фронтендом і очікуваною поведінкою налаштувань.
- Додано машинозчитуваний артефакт перевірки (JSON), що спрощує triage у CI-логах.
