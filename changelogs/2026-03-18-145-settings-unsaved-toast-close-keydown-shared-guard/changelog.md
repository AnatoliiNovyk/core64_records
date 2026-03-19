# 2026-03-18 #145 — Settings Unsaved Toast Close Keydown Shared Guard

## Було
- `handleSettingsUnsavedToastCloseButtonKeydown(event)` не використовував спільний keydown-guard (`defaultPrevented`/`isComposing`/модифікатори), на відміну від інших keyboard-обробників.

## Зміна
- Додано ранній вихід у `handleSettingsUnsavedToastCloseButtonKeydown(event)`: `if (shouldIgnoreSettingsUnsavedKeydownEvent(event)) return;`.

## Стало краще
- Keyboard-логіка close-кнопки тоста стала консистентною з toast/modal обробниками.
- Менше ризику небажаної реакції на вже оброблені, composition або модифікаторні keydown-події.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено використання `shouldIgnoreSettingsUnsavedKeydownEvent(event)` у close-button handler.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
