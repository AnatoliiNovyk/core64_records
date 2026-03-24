# Changelog - 2026-03-18 - Settings unsaved toast a11y aria-label

`settings-unsaved` toast мав `role="status"` і `aria-live`, але не формував контекстну ARIA-підказку про стан черги.
Screen reader не отримував єдине коротке повідомлення з поточним текстом + кількістю відкладених toast.

Файл: `admin.js`

- Додано `updateSettingsUnsavedToastAriaLabel()`:
- будує динамічний `aria-label` для `#settings-unsaved-toast`;
- враховує активне повідомлення `settingsUnsavedToastCurrent`;
- враховує кількість відкладених повідомлень у черзі;
- додає підказку про клавішне закриття (Enter/Space) при активному toast;
- прибирає `aria-label`, якщо немає активного/відкладених повідомлень.
- Інтегровано виклики оновлення ARIA в lifecycle:
- після enqueue;
- після dequeue;
- після активації нового toast;
- під час finalize/close.

Підвищено доступність: користувачі assistive technology отримують чіткіший контекст поточного стану toast-системи.
Зменшено когнітивне навантаження при наявності черги відкладених повідомлень.
Збережено сумісність із поточними механіками: дедуплікація, пріоритет warn, queue-limit, progress bar, manual dismiss.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
