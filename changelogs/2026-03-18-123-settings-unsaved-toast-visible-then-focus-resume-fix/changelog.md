# Changelog - 2026-03-18 - Settings unsaved toast visible-then-focus resume fix

## Як було
- У сценарії, коли вкладка ставала `visible` до фактичного фокусу вікна, visibility-пауза могла залишатися активною.
- Подальший `window focus` обробляв лише blur-паузу, тому toast міг не відновити таймер.

## Що зроблено
- Файл: admin.js
  - Оновлено `handleSettingsUnsavedToastWindowFocus()`:
    - додано ранній фокус-гард;
    - додано гілку для `settingsUnsavedToastPausedByVisibility` з явним `resume`;
    - після цього залишено існуючу гілку для `settingsUnsavedToastPausedByWindowBlur`.

## Що покращило
- Ланцюжок `visible -> focus` тепер стабільно відновлює таймер toast.
- Усунено стан, коли toast зависав на паузі після повернення користувача.
- Поведінка pause/resume стала узгодженою для обох джерел паузи.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
