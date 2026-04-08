## Як було
- У секціях Requests і Audit використовувались native поля `type=date`, які рендерять формат дати за локаллю ОС/браузера.
- Через це навіть у EN-режимі відображався формат `дд.мм.рррр`, що виглядало як невиправлена локалізація.
- Попереднє встановлення `lang/locale` не гарантувало очікуваний візуальний формат у всіх середовищах.

## Що зроблено
- У `admin.html` для полів:
  - `#contacts-filter-date`
  - `#audit-date-from`
  - `#audit-date-to`
  замінено `type=date` на керований `type=text` з `inputmode="numeric"` та `autocomplete="off"`.
- У `admin.js` додано локалізований контроль формату дати:
  - `parseLocaleDateFilter()` — приймає EN/UK формати та конвертує в ISO (`YYYY-MM-DD`) для фільтрів.
  - `formatIsoDateForLocaleFilter()` — рендерить ISO у формат для активної мови (EN: `MM/DD/YYYY`, UK: `DD.MM.YYYY`).
  - `normalizeDateFilterControlValue()` — уніфікує значення інпутів і підтримує стабільне відображення.
- Оновлено місця використання фільтрів у Requests/Audit (`getNormalizedAuditFilters`, `validateAuditDateRange`, `applyAuditDatePreset`, `onAuditDateInputChange`, `normalizeContactsDateControlValue`) на новий форматований потік.
- Оновлено i18n placeholders для цих полів:
  - UK: `ДД.ММ.РРРР`
  - EN: `MM/DD/YYYY`
- Проведено перевірку:
  - diagnostics для `admin.js`/`admin.html` — без помилок;
  - `node scripts/smoke-check.mjs` — passed;
  - `npm run ui-smoke` — passed.

## Що покращило/виправило/додало
- Локалізація форматів дат у Requests/Audit стала реально керованою і незалежною від OS-локалі.
- У EN-режимі поля показують очікуваний формат `MM/DD/YYYY`, у UK — `DD.MM.YYYY`.
- Внутрішня логіка фільтрації збережена: у бекенд і фільтри далі йде ISO-значення, тож регресії контракту не внесені.
