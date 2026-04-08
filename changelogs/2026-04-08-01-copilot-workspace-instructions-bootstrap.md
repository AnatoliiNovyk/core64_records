# Changelog 2026-04-08 #01 - Copilot Workspace Instructions Bootstrap

## Як було

- У робочому корені не було єдиного workspace-файлу інструкцій для агента (`.github/copilot-instructions.md`).
- Контекст проєкту був розподілений між `README.md`, runbook-доками та окремими нотатками.

## Що було зроблено

- Створено `.github/copilot-instructions.md` з компактними секціями:
  - Architecture
  - Build And Test
  - Conventions
  - Environment Pitfalls
  - References
- Додано практичні правила для цього репозиторію:
  - API-first `data-adapter.js` з fallback
  - маршрутний контракт `/api/:type`
  - вимога `isConnected`-guard у `admin.js`
  - порядок bootstrap в admin (auth перед dashboard)
  - вимога changelog після реалізованих задач
- Додано посилання на чинні документаційні джерела замість дублювання їхнього вмісту.

## Що це покращило, виправило, додало

- Агент отримав єдину стартову інструкцію в очікуваному місці `.github/copilot-instructions.md`.
- Зменшено ризик відхилень від проєктних конвенцій при наступних змінах.
- Прискорено онбординг для нових задач завдяки короткому переліку команд, патернів і посилань на релевантні runbook-документи.
