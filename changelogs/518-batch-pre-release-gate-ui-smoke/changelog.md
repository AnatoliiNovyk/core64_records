# 518 Batch - pre-release gate UI smoke

Як було:

- Unified pre-release gate автоматизував helper self-tests, API smoke і branch protection verification, але browser-level перевірка admin/public section settings лишалася поза CI.
- `ui-smoke` уже існував локально, проте release gate не встановлював root npm dependencies і Playwright Chromium для його запуску.

Що зроблено:

- У `.github/workflows/pre-release-gate.yml` додано cache-aware Node setup для root `package-lock.json`.
- Після існуючого `smoke-check` додано кроки `npm ci`, `npx playwright install --with-deps chromium` і headless запуск `npm run ui-smoke`.
- Піднято `timeout-minutes` workflow до 20 хвилин, щоб gate мав реальний запас часу на browser install і UI smoke.
- `README.md` синхронізовано з новим складом unified pre-release gate.

Що це покращило / виправило / додало:

- Закрито automation gap між API smoke і реальним browser verification у release gate.
- Pre-release verdict тепер охоплює не лише backend/API та branch policy, а й фактичний admin/public flow для section settings.
- CI setup для UI smoke став відтворюваним: workflow сам встановлює потрібні root dependencies і Chromium.
