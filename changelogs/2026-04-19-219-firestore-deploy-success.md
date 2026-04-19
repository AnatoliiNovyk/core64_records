# 2026-04-19-219 — Firestore deploy успішний (виправлення ліміту inputs)

## Як було
- GitHub Actions workflow `deploy-google-run.yml` містив **27 inputs** (додано `data_backend` та `firestore_project_id` в PR #8).
- GitHub обмежує `workflow_dispatch` до максимум **25 inputs**.
- При спробі dispatch отримували: `"you may only define up to 25 inputs for a workflow_dispatch event"` (HTTP 422).
- Всі попередні запуски деплою завершувалися `conclusion=failure` без запуску жодного job (total_count=0).

## Що зроблено
1. Видалено 2 inputs з найменшим впливом: `core64_smoke_timeout_ms` (60000) та `core64_smoke_retries` (3).
2. Їхні значення захардкоджені як рядкові константи в env-блоці кроку `Post-deploy smoke check`.
3. Тепер workflow має рівно **25 inputs** — відповідає ліміту GitHub.
4. Зміна запушена у гілку `fix/workflow-25-input-limit`, PR #9 — злито через тимчасове відключення `enforce_admins` (відновлено відразу після merge).
5. Workflow dispatched з `data_backend=firestore, firestore_project_id=core64records`.
6. Run `24636470120` завершився `conclusion=success`.

## Результат
- `GET https://core64.pp.ua/api/health` повертає `"dataBackend": "firestore"`.
- Бекенд повністю перемігрований з **Neon PostgreSQL → Google Firestore**.
- Проблема `HTTP 507 Insufficient Storage` (Neon DB quota exceeded) усунена.
