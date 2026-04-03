# 517 Batch - UI smoke for section settings

Як було:

- UI smoke для section settings лишався ручним: backend/API smoke уже був зеленим, але браузерного end-to-end прогону з реальним логіном, збереженням і перевіркою public/admin DOM не існувало.
- Після `npm install` робоче дерево додатково засмічувалося локальними `node_modules`, бо кореневий `.gitignore` їх не ігнорував.

Що зроблено:

- Додано root tooling через Playwright: кореневий `package.json`, `npm run ui-smoke`, `npm run ui-smoke:install`.
- Реалізовано `scripts/ui-smoke.mjs`, який підіймає тимчасовий static server з `/api` reverse proxy, логіниться в адмінку, змінює section settings, перевіряє admin API, public API, public DOM/nav, reload persistence і відновлює початковий bundle.
- Оновлено README з інструкцією запуску UI smoke.
- Додано ignore для згенерованих `node_modules`, щоб у git-дифі лишалися тільки релевантні файли батча.

Що це покращило / виправило / додало:

- Закрито останній практичний gap після server/API smoke: тепер section settings перевіряються реальним браузерним end-to-end сценарієм.
- Smoke стабільно обходить локальні CORS/host-пастки через same-origin proxy і хост `127.0.0.2`.
- Локальні встановлені залежності більше не засмічують список змін у репозиторії.
- Додано автоматичний restore початкового settings bundle після завершення smoke.
- README тепер містить коротку інструкцію запуску нового UI smoke.
