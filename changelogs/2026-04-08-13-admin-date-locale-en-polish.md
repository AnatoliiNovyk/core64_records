# 2026-04-08-13 Admin Date Locale EN Polish

## Як було

- У секції Audit поля дати `Від дати` і `До дати` не мали `data-i18n-placeholder`, тому placeholder не локалізувався через стандартний i18n-прохід.
- У `syncDocumentLanguage()` для `<html>` виставлявся короткий код мови (`uk`/`en`), без повного locale tag.
- Для `input[type=date]` не застосовувався явний locale-атрибут у runtime-перекладі, через що в EN-режимі залишалися візуальні артефакти формату дати залежно від браузера/ОС.

## Що зроблено

- У `admin.html` для `#audit-date-from` і `#audit-date-to` додано `data-i18n-placeholder` та стартові placeholder-значення.
- У `admin.js` (словники `ADMIN_I18N.uk/en`) додано ключі:
  - `auditDateFromPlaceholder`
  - `auditDateToPlaceholder`
- У `applyAdminStaticTranslations()` додано окремий прохід по `input[type=date]` із встановленням:
  - `lang=<active locale tag>`
  - `data-locale=<active locale tag>`
- У `syncDocumentLanguage()` змінено встановлення `lang` на повний locale tag через `getActiveLocaleTag()`.
- Проведено верифікацію:
  - diagnostics: без помилок для `admin.js` і `admin.html`
  - `node scripts/smoke-check.mjs`: passed
  - `npm run ui-smoke`: passed

## Що покращило/виправило/додало

- Виправлено локалізаційний розрив у Audit date-полях: placeholders тепер коректно перемикаються між uk/en.
- Покращено консистентність локалі документа та native date-контролів через єдиний locale tag (`uk-UA`/`en-US`).
- Знижено ймовірність EN-візуальних артефактів у форматі дати без інвазивної заміни native date-контролів.
- Збережено поточну бізнес-логіку фільтрів, ISO-представлення значень дат і загальну стабільність адмінки.
