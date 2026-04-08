# Changelog 2026-04-08 #04 - API Base Override Precedence Fix

## Як було

- У `data-adapter.js` пріоритет API base URL був таким: query override -> runtime -> `CORE64_CONFIG.apiBaseUrl` -> localStorage override -> `/api`.
- Через це збережений override у localStorage міг ігноруватись, якщо в сторінці заданий `CORE64_CONFIG.apiBaseUrl`.

## Що було зроблено

- Оновлено порядок визначення API base URL у `getApiBaseUrl()`:
  - query override
  - runtime
  - localStorage override
  - `CORE64_CONFIG.apiBaseUrl`
  - `/api`
- Додано короткий коментар у коді про те, що persisted manual override має вищий пріоритет за статичний page config.

## Що це покращило, виправило, додало

- Виправлено фактичну поведінку persisted API override для наступних візитів.
- Зменшено ризик post-deploy збоїв в admin/public при розділених доменах frontend/backend.
- Поведінка адаптера стала консистентною з очікуваним emergency troubleshooting flow.
