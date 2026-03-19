# Changelog - 2026-03-18 - Settings unsaved toast blur/visibility race fix

## Як було
- Після кроку з взаємовиключними pause-прапорцями існував race-case:
  - `visibilitychange(hidden)` ставив visibility-паузу і зупиняв таймер;
  - наступний `window blur` міг скинути visibility-прапорець, коли таймер уже був зупинений.
- У підсумку обидва pause-прапорці могли стати `false`, і автоматичне відновлення після повернення у вкладку не спрацьовувало.

## Що зроблено
- Файл: admin.js
  - У `handleSettingsUnsavedToastWindowBlur()` додано early-return:
    - якщо `document.hidden` або вже активний `settingsUnsavedToastPausedByVisibility`, blur-обробник не втручається.

## Що покращило
- Збережено коректне джерело паузи під час послідовності `visibilitychange -> blur`.
- Відновлення таймера після повернення у вкладку знову детерміноване.
- Усунуто можливість "завислого" toast без авто-resume у фонового сценарію.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
