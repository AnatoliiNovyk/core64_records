# Changelog #177: Guarded modal Tab focus loop targets

У `handleSettingsUnsavedModalKeyboard()` під час Tab-циклювання викликались `last.focus()` та `first.focus()` без додаткових safety-guard.
У рідкісних race-сценаріях (динамічний DOM під час кадру) це могло призвести до винятку.

Для обох гілок Tab-циклювання додано defensive-guard:

- перевірка `isConnected` перед фокусом
- виклик `focus()` обгорнуто в `try/catch`.

Бізнес-логіка і поведінка циклювання фокусу не змінені.

Менше ризику runtime-винятків у момент keyboard-навігації по модалці.
Надійніша робота focus-trap у нестабільних браузерних станах.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `handleSettingsUnsavedModalKeyboard()` присутні `last.isConnected` і `first.isConnected`
- `focus()` для обох елементів обгорнутий у `try/catch`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
