# Changelog - 2026-03-18 - Settings unsaved modal localize and highlight

## Що зроблено
- Локалізовано англомовний підпис у modal:
  - `Preview tooltip` -> `Попередній tooltip`.
- Додано візуальне підсвічування тільки для тих рядків diff, де значення порогів реально змінилися.

## Технічні зміни
- Файл: `admin.html`
  - Додано ID для рядків diff:
    - `settings-unsaved-diff-good-row`
    - `settings-unsaved-diff-warn-row`
  - Локалізовано підпис блоку preview tooltip.

- Файл: `admin.js`
  - Оновлено `updateSettingsUnsavedModalDiffSummary()`:
    - визначає `goodChanged` та `warnChanged`;
    - умовно застосовує підсвічування (`bg-amber-500/10`, `border`, `border-amber-500/30`) тільки до змінених рядків.

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Modal став більш читабельним і локалізованим.
- Увага користувача фокусується тільки на фактично змінених параметрах.
