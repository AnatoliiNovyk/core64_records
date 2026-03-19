# Changelog - 2026-03-18 - Settings unsaved modal status preview

## Що зроблено
- Додано в modal незбережених змін рядок «Прогноз статусу», який показує, який стан індикатора latency буде застосовано з новими порогами.
- Прогноз базується на поточному середньому latency (rolling average) та відредагованих порогах.
- Підтримані стани:
  - `немає даних`
  - `добре (N ms)`
  - `помірно (N ms)`
  - `повільно (N ms)`

## Технічні зміни
- Файл: `admin.html`
  - У `#settings-unsaved-modal` додано поле:
    - `#settings-unsaved-preview-status`

- Файл: `admin.js`
  - Оновлено `updateSettingsUnsavedModalDiffSummary()`:
    - обчислює середню затримку з `auditLatencyHistory`;
    - порівнює її з поточними (незбереженими) порогами;
    - встановлює текст/колір для `#settings-unsaved-preview-status`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Перед підтвердженням переходу користувач бачить не лише зміну порогів, а й практичний вплив цих змін на статус latency.
