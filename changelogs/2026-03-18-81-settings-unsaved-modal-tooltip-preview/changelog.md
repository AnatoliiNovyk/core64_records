# Changelog - 2026-03-18 - Settings unsaved modal tooltip preview

## Що зроблено
- Додано в modal незбережених змін preview повного tooltip-тексту індикатора latency.
- Preview формує реальний текст у форматі:
  - пороги (`добре/помірно/повільно`)
  - поточний прогнозований стан (`немає даних / добре / помірно / повільно`).

## Технічні зміни
- Файл: `admin.html`
  - У `#settings-unsaved-modal` додано блок:
    - `#settings-unsaved-preview-tooltip`

- Файл: `admin.js`
  - Оновлено `updateSettingsUnsavedModalDiffSummary()`:
    - додає обчислення тексту preview tooltip на основі:
      - поточних (незбережених) порогів;
      - середнього latency з `auditLatencyHistory`.
    - синхронізує повідомлення зі статусом, який використовується в індикаторі.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Перед рішенням у modal користувач бачить не лише «було -> стало», а й фінальний текст пояснення, який отримує UI-індикатор після збереження.
