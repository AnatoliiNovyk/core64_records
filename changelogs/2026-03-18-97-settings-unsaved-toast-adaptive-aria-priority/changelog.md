# Changelog - 2026-03-18 - Settings unsaved toast adaptive ARIA priority

## Як було
- `settings-unsaved` toast завжди працював з фіксованими ARIA-параметрами (`role="status"`, `aria-live="polite"`).
- Попереджувальні повідомлення (`warn`) і успішні (`success`) оголошувались з однаковим пріоритетом.

## Що зроблено
- Файл: `admin.js`
  - У `processSettingsUnsavedToastQueue()` додано адаптивні ARIA-атрибути за тоном toast:
    - для `success`: `aria-live="polite"`, `role="status"`;
    - для `warn`: `aria-live="assertive"`, `role="alert"`.

## Що покращило
- Screen reader отримує пріоритетніші оголошення для попереджувальних повідомлень.
- Успішні повідомлення лишаються менш нав’язливими (polite), що зменшує шум.
- Візуальна поведінка toast і бізнес-логіка черги не змінені.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
