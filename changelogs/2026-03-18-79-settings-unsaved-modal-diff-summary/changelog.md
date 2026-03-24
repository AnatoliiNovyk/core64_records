# Changelog - 2026-03-18 - Settings unsaved modal diff summary

Додано inline-пояснення у modal незбережених змін, яке показує різницю порогів `було -> стало` перед переходом із `settings`.
Порівняння виводиться для обох полів:

- `Добре до (ms)`
- `Помірно до (ms)`

Файл: `admin.html`

- У `#settings-unsaved-modal` додано інформаційний блок із полями:
- `#settings-unsaved-diff-good`
- `#settings-unsaved-diff-warn`

Файл: `admin.js`

- Додано `updateSettingsUnsavedModalDiffSummary()`:
- читає збережені значення з `cache.settings`;
- читає поточні значення з input-полів;
- нормалізує пороги та заповнює `було -> стало` у modal.
- Оновлено `showSettingsUnsavedNavigationModal()`:
- перед відкриттям викликає `updateSettingsUnsavedModalDiffSummary()`.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

Рішення в modal стало більш інформативним: користувач бачить точний обсяг незбережених змін до натискання дії.
