# Changelog - 2026-03-18 - Settings unsaved toast focus restore

## Як було
- Якщо фокус переходив у toast (контейнер/кнопка закриття) і toast закривався, фокус міг залишатися на прихованому елементі.
- Для клавіатурної навігації це створювало нестабільний UX після dismiss/auto-close.

## Що зроблено
- Файл: admin.js
  - Додано стан `settingsUnsavedToastReturnFocusEl`.
  - Додано `updateSettingsUnsavedToastReturnFocus(event)` для фіксації елемента, з якого фокус зайшов у toast.
  - Оновлено `handleSettingsUnsavedToastFocusIn(event)` для збереження fallback-фокусу перед паузою таймера.
  - У `processSettingsUnsavedToastQueue()` додано захоплення поточного активного елемента (поза toast) як резервну ціль повернення.
  - У `finalizeSettingsUnsavedToastDisplay()` додано безпечне повернення фокусу через `requestAnimationFrame`, якщо на момент закриття активний елемент був усередині toast.

## Що покращило
- Стабільніший клавіатурний флоу після закриття toast.
- Фокус повертається до попереднього контексту замість "втрати" на прихованому вузлі.
- Логіка queue/timer/a11y лишилась сумісною.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
