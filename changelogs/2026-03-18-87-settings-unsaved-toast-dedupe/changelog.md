# Changelog - 2026-03-18 - Settings unsaved toast dedupe

Додано дедуплікацію однакових `settings-unsaved` toast-повідомлень, що йдуть поспіль.
Відсікання працює і для активного toast, і для останнього елемента в черзі.

Файл: `admin.js`

- Додано стан `settingsUnsavedToastCurrent` для відстеження активного повідомлення.
- Оновлено `processSettingsUnsavedToastQueue()`:
- при показі нового toast записує поточний елемент у `settingsUnsavedToastCurrent`;
- після завершення таймера очищує `settingsUnsavedToastCurrent`.
- Оновлено `showSettingsUnsavedToast(message, tone)`:
- якщо нове повідомлення збігається з активним toast, не додається;
- якщо нове повідомлення збігається з останнім у черзі, не додається;
- у решті випадків повідомлення додається як і раніше (з існуючим queue-limit).

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

У потоці швидких однакових дій користувач більше не бачить дублікати toast-повідомлень поспіль.
Збережено послідовність показу різних повідомлень і наявний захист лімітом черги.
