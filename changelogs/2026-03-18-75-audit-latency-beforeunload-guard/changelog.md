# Changelog - 2026-03-18 - Audit latency beforeunload guard

## Що зроблено
- Додано захист від випадкової втрати незбережених порогів latency.
- Якщо пороги змінені, але не збережені, при спробі закрити/перезавантажити вкладку браузер показує стандартне попередження `beforeunload`.

## Технічні зміни
- Файл: `admin.js`
  - Додано прапорець стану:
    - `hasUnsavedAuditLatencyThresholdChanges`
  - Оновлено `setAuditLatencyThresholdsDirtyState(isDirty)`:
    - синхронізує глобальний dirty-прапорець.
  - Додано обробник:
    - `handleUnsavedSettingsBeforeUnload(event)`
  - У `DOMContentLoaded` додано:
    - `window.addEventListener("beforeunload", handleUnsavedSettingsBeforeUnload)`

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Ризик випадково втратити незбережені зміни порогів latency у налаштуваннях зменшено.
