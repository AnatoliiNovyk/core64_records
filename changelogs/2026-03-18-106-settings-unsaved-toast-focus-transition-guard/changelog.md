# Changelog - 2026-03-18 - Settings unsaved toast focus transition guard

## Як було
- `onfocusin`/`onfocusout` у toast напряму викликали pause/resume таймера.
- При переході фокусу між внутрішніми елементами toast (наприклад, контейнер -> кнопка `X`) можливе коротке передчасне `resume`.

## Що зроблено
- Файл: `admin.js`
  - Додано:
    - `handleSettingsUnsavedToastFocusIn()`
    - `handleSettingsUnsavedToastFocusOut(event)`
  - У `handleSettingsUnsavedToastFocusOut(event)` додано перевірку `relatedTarget`:
    - якщо новий фокус лишається всередині toast, `resume` не викликається.
- Файл: `admin.html`
  - Замінено inline focus-обробники на нові хелпери:
    - `onfocusin="handleSettingsUnsavedToastFocusIn(event)"`
    - `onfocusout="handleSettingsUnsavedToastFocusOut(event)"`

## Що покращило
- Стабільніша pause/resume поведінка під час клавіатурної навігації всередині toast.
- Усунуто мікро-флікер таймера при внутрішніх focus-переходах.
- Поточна логіка queue/timer/a11y лишилась сумісною.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
