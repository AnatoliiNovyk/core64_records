# Changelog #176: Guarded autofocus for unsaved modal primary button

У `showSettingsUnsavedNavigationModal()` autofocus primary-кнопки виконувався як `requestAnimationFrame(() => primaryBtn.focus())`.
У рідкісних edge-сценаріях елемент міг стати недоступним/відʼєднаним або `focus()` міг кинути виняток.

Розширено блок autofocus primary-кнопки:

- додано `if (!primaryBtn.isConnected) return;`
- `primaryBtn.focus()` обгорнуто в `try/catch`.

Поведінка модалки не змінена; посилено тільки захист від edge-винятків.

Менше ризику runtime-винятків під час autofocus при швидких DOM-оновленнях.
Стабільніший показ модалки у нестандартних/повільних браузерних умовах.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `settings-unsaved-save-btn` autofocus-блок присутній
- у блоці присутні `primaryBtn.isConnected` і `try/catch` навколо `primaryBtn.focus()`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
