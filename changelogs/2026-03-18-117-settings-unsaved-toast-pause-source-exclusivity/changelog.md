# Changelog - 2026-03-18 - Settings unsaved toast pause source exclusivity

Після попередніх guard-кроків `blur` і `visibilitychange` могли тимчасово формувати змішані комбінації pause-прапорців під час швидких переходів стану.
Це не ламало базову логіку, але ускладнювало передбачуваність state-machine.

Файл: admin.js

- У `handleSettingsUnsavedToastVisibilityChange()` при `document.hidden` примусово скидається `settingsUnsavedToastPausedByWindowBlur = false` перед встановленням visibility-паузи.
- У `handleSettingsUnsavedToastWindowBlur()` примусово скидається `settingsUnsavedToastPausedByVisibility = false` перед встановленням blur-паузи.

Джерела паузи (`blur` vs `visibility`) стали взаємовиключними.
Простіший і більш детермінований життєвий цикл resume.
Менше шансів на важковідтворювані edge-case переходи між фоновими станами.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
