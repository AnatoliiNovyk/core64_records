# 2026-04-09-08 Pre Release Gate Localhost Fallback

## Як було

- Локальний запуск [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1) падав на кроці smoke з `fetch failed` при `CORE64_API_BASE=http://localhost:3000/api`.
- При цьому API був доступний, а ручний запуск smoke через `http://127.0.0.1:3000/api` проходив успішно.
- Через це gate міг ламатися в робочому локальному оточенні тільки через резолв `localhost`.

## Що зроблено

- У [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1) додано безпечний retry-механізм для кроку `[7/8]`.
- Якщо перший запуск smoke падає і base URL містить `localhost`, скрипт автоматично:
  - перемикає `CORE64_API_BASE` на `127.0.0.1` з тим самим портом/шляхом;
  - повторно запускає `node scripts/smoke-check.mjs`.
- Якщо повторний запуск також падає, скрипт завершується тим самим `Smoke check failed.` без зміни fail-fast поведінки.

## Що покращило/виправило/додало

- Зменшено кількість хибних локальних падінь pre-release gate, пов'язаних лише з `localhost` резолвом.
- Збережено існуючий контроль якості: gate все ще падає при реальних проблемах smoke.
- Поліпшено надійність локального релізного контуру без зміни CI/production сценаріїв.
