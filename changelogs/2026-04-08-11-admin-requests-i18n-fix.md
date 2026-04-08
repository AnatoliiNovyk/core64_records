# 2026-04-08-11 Admin Requests I18n Fix

## Як було
- У секції Requests в адмінці залишались hardcoded тексти українською в заголовку, кнопках дій, фільтрах і плейсхолдерах.
- У режимі Eng це давало змішаний інтерфейс: частина рядків не перемикалася мовою.
- Частина title-підказок і option-ів статусу не була прив'язана до словника локалізації.

## Що зроблено
- У `admin.html` для блоку `section-contacts` додано `data-i18n`, `data-i18n-title`, `data-i18n-placeholder` для:
  - заголовка секції;
  - кнопок bulk-дій та експорту;
  - label-ів фільтрів;
  - option-ів статусу (`all/new/in_progress/done`);
  - плейсхолдерів і title-підказок полів дати та пошуку.
- У `admin.js` в `ADMIN_I18N.uk` і `ADMIN_I18N.en` додано відсутні ключі Requests для всіх нових i18n-прив'язок.
- Бізнес-логіку Requests (bulk update, status update, pagination, CSV export) не змінено.
- Прогнано валідацію: diagnostics + `node scripts/smoke-check.mjs` + `npm run ui-smoke`.

## Що покращило/виправило/додало
- Секція Requests коректно перемикається між UK/EN без змішаних статичних рядків.
- Локалізація стала уніфікованою для тексту, title і placeholder у межах одного i18n-механізму.
- Знижено ризик повторної появи hardcoded текстів у Requests при подальших змінах.
