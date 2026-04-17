# Changelog 2026-04-17 #27 - UI smoke token race guard

## Як було

- Після попереднього auth-hardening `Run UI smoke` падав з помилкою `Admin auth token was not stored in sessionStorage`.
- У `run()` токен читався окремо через `getAuthToken`, що створювало race-вікно між login flow і наступним кроком сценарію.

## Що зроблено

- `ensureAdminLoggedIn` тепер:
- повертає обчислений/оновлений токен;
- перед поверненням примусово фіксує токен у `sessionStorage` через `persistAdminSessionToken`.
- У `run()` прибрано окреме читання токена через `getAuthToken`; тепер використовується токен, повернений з `ensureAdminLoggedIn`.
- Видалено невикористаний helper `getAuthToken`.

## Що покращило/виправило/додало

- Прибрано race між завершенням login sequence і початком API-операцій у `ui-smoke`.
- Токен-стан у сценарії став більш детермінованим і керованим з однієї точки.
- Зменшено ризик раннього падіння smoke-тесту до етапу перевірки settings/public persistence.
