# Changelog - 2026-03-18 - Settings unsaved toast window focus pause

## Як було
- Таймер автозакриття toast паузився на `visibilitychange`, але не враховував втрату фокусу вікна (window blur), коли вкладка могла залишатися видимою.
- У частині сценаріїв повернення до вікна повідомлення могло зникнути раніше, ніж очікує користувач.

## Що зроблено
- Файл: admin.js
  - Додано `handleSettingsUnsavedToastWindowBlur()` для паузи автозакриття активного toast.
  - Додано `handleSettingsUnsavedToastWindowFocus()` для відновлення таймера після повернення у вікно (з перевіркою `document.hidden`).
  - У `DOMContentLoaded` додано підписки:
    - `window.addEventListener("blur", handleSettingsUnsavedToastWindowBlur)`
    - `window.addEventListener("focus", handleSettingsUnsavedToastWindowFocus)`

## Що покращило
- Автозакриття toast стало стабільнішим при перемиканні між вікнами/додатками.
- Менше ризику, що toast зникне під час неактивного стану вікна.
- Сумісно з поточною логікою `visibilitychange`, queue та a11y.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
