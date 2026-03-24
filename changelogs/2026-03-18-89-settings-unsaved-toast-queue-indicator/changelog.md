# Changelog - 2026-03-18 - Settings unsaved toast queue indicator

Toast для `settings-unsaved` показував лише поточне повідомлення.
Коли в черзі накопичувались відкладені повідомлення, у UI не було видимого індикатора їх кількості.

Файл: `admin.html`

- Оновлено контейнер `#settings-unsaved-toast`:
- додано `#settings-unsaved-toast-message` для тексту активного повідомлення;
- додано `#settings-unsaved-toast-queue` як компактний бейдж кількості відкладених toast.

Файл: `admin.js`

- Додано `updateSettingsUnsavedToastQueueBadge()` для синхронізації бейджа з фактичною довжиною черги.
- Інтегровано виклики синхронізації бейджа в lifecycle черги:
- після `shift()` у `processSettingsUnsavedToastQueue()`;
- після завершення таймера показу;
- після enqueue/trim у `showSettingsUnsavedToast()`.
- Оновлено рендер тексту toast:
- при наявності `#settings-unsaved-toast-message` текст оновлюється через цей елемент;
- збережено fallback до старої поведінки, якщо елемент відсутній.

Користувач бачить, що в черзі є відкладені повідомлення (формат `+N`).
Зменшено невизначеність під час швидких серій подій у settings-unsaved flow.
Поведінка сумісна з попередніми покращеннями: пріоритет warn, дедуплікація, queue-limit.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
