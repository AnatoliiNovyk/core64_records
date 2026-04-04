# 519 Batch - pre-release execution validation

Як було:

- Після інтеграції `ui-smoke` в unified pre-release gate потрібно було підтвердити, що production endpoint реально проходить і API smoke, і browser UI smoke з актуальним `ADMIN_PASSWORD`.
- Автоматичний запуск GitHub workflow із локального середовища був недоступний через відсутні `gh` CLI і GitHub token у shell.

Що зроблено:

- Визначено актуальний production API base URL сервісу Cloud Run: `https://core64-api-rjyrggtsaq-ew.a.run.app/api`.
- Виконано `smoke-check` у full mode проти production API з `CORE64_SMOKE_CONTACT=false` і timeout `15000`.
- Після первинного 401 на admin auth використано актуальний `ADMIN_PASSWORD` із Secret Manager (`core64records/ADMIN_PASSWORD`) без логування значення у консоль.
- Повторний API smoke завершився `passed: true`.
- Виконано `npm run ui-smoke` у headless режимі проти production API; сценарій пройшов повністю (`passed: true`) з успішним restore через `/settings/bundle`.

Що це покращило / виправило / додало:

- Практично підтверджено, що новий pre-release flow (API + UI smoke) працездатний на реальному production endpoint.
- Виявлено і закрито операційний ризик неактуального admin пароля для gate-запусків.
- Отримано валідоване значення для поля `API base URL for smoke-check` у workflow dispatch.
