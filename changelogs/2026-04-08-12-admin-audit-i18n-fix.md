# 2026-04-08-12 Admin Audit I18n Fix

## Як було

- У секції Audit залишались hardcoded рядки, через що в режимі Eng інтерфейс був частково українським.
- Статичні тексти в `admin.html` (заголовок, кнопки, labels, select options, loading, службові підписи) не були підключені до i18n-механізму.
- У рендері записів аудиту в `admin.js` був жорстко зашитий підпис `Details:`.

## Що зроблено

- У `admin.html` для блоку `section-audit` додано `data-i18n`, `data-i18n-title`, `data-i18n-placeholder` для:
  - заголовка секції;
  - кнопок керування (clear/export/refresh/force refresh);
  - labels і title-підказок усіх фільтрів;
  - preset і refresh option-ів;
  - eco mode тексту;
  - стартових статусних рядків (`audit-refresh-status`, `audit-last-updated`, `audit-last-latency`, `audit-total-count`, shortcut hint);
  - loading-повідомлення та дефолтного shortcut toast.
- У `admin.js` (словники `ADMIN_I18N.uk` і `ADMIN_I18N.en`) додано нові ключі локалізації для всіх нових прив'язок Audit.
- У `admin.js` в `renderAuditLogs()` замінено hardcoded `Details:` на `tAdmin("auditDetailsLabel")`.
- Бізнес-логіку Audit (фільтри, автооновлення, force refresh, пагінація, CSV export) не змінювали.

## Що покращило/виправило/додало

- Секція Audit тепер має консистентне перемикання UK/EN для статичного UI.
- Зменшено ризик повторної появи змішаних мов у фільтрах і панелі станів Audit.
- Локалізація уніфікована через поточний i18n-пайплайн (`data-i18n*` + `tAdmin`).

## Перевірки

- Diagnostics: без помилок для `admin.html` і `admin.js`.
- `node scripts/smoke-check.mjs`: `passed: true`.
- `npm run ui-smoke`: `passed: true`.
