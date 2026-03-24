# Changelog - 2026-03-18 - Audit latency unsaved changes badge

Додано бейдж «Незбережені зміни порогів» у секцію налаштувань порогів latency.
Реалізовано live-dirty tracking для полів порогів:

- бейдж показується під час редагування, якщо значення відрізняються від збережених у `settings`;
- бейдж ховається після успішного збереження.

Залишено live-preview: зміна input одразу оновлює легенду/tooltip/індикатор latency.

Файл: `admin.html`

- Для `setting-audit-latency-good-max` і `setting-audit-latency-warn-max` додано `oninput="handleAuditLatencyThresholdInputsChanged()"`.
- Додано елемент бейджа:
- `id="setting-audit-latency-dirty"`

Файл: `admin.js`

- Додано helper-и:
- `getNormalizedLatencyThresholds(source)`
- `setAuditLatencyThresholdsDirtyState(isDirty)`
- `syncAuditLatencyThresholdsDirtyState()`
- `handleAuditLatencyThresholdInputsChanged()`
- `applyAuditLatencyThresholds()` переведено на використання нормалізованих порогів.
- У `loadSettings()`:
- нормалізовані значення завантажуються в поля;
- dirty-state скидається.
- У `saveSettings()` після успішного збереження dirty-state скидається.
- У `resetAuditLatencyThresholdsForm()` додано ресинхронізацію dirty-state.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

Адміністратор чітко бачить, коли пороги змінені, але ще не збережені.
UX зменшує ризик випадково покинути сторінку без збереження важливих змін порогів.
