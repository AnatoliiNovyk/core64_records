# Changelog 2026-04-10 #03 - Fix settings save for large logos and increase logo scale

## Як було
- При збереженні налаштувань із logo data URL адмінка показувала загальну помилку "Failed to save settings" і зміни не зберігались.
- Ліміт `express.json` у backend був `1mb`, що ставало вузьким місцем для payload з двома logo.
- В адмінці upload-ліміт і підказки були зав'язані на 500KB.
- На публічній сторінці логотипи рендерились дрібно через жорсткі `h-*` і `max-w-*` обмеження.

## Що було зроблено
- Підвищено backend JSON body limit з `1mb` до `10mb` у `backend/src/server.js`.
- Додано явну обробку oversized payload у backend error middleware: повертається `413 PAYLOAD_TOO_LARGE`.
- Збільшено допустиму довжину logo полів у `settingsSchema` до `4000000` символів для `headerLogoUrl` і `footerLogoUrl`.
- Підвищено frontend upload-ліміт у `admin.js` до `2MB` на файл.
- Оновлено i18n/підказки в адмінці (UA/EN) для нового ліміту `2MB`.
- Додано окреме повідомлення в `saveSettings()` для `413` (замість загального `settingsSaveFailed`).
- Збільшено відображення логотипів на public:
  - header: `h-14`, `max-w-[320px]`
  - footer: `h-12`, `max-w-[260px]`
- Виконано перевірки: diagnostics, `node scripts/smoke-check.mjs`, `npm run ui-smoke`.

## Що це покращило, виправило, додало
- Усунуто причину падіння Save для великих logo payload у налаштуваннях.
- Користувач отримує зрозумілу помилку для oversized запиту, а не загальний fail.
- Логотипи в шапці та футері стали помітно більшими й читабельнішими.
- Синхронізовано ліміти frontend/backend/валідації для стабільнішого брендинг-флоу.
