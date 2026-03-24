# Changelog - 2026-03-18 - Settings unsaved three-option modal

Замінив простий `confirm` при виході з `settings` на кастомний modal із трьома варіантами:

- `Зберегти і перейти`
- `Перейти без збереження`
- `Скасувати`

Додав UX-логіку переходу:

- при `Зберегти і перейти` виконується збереження і лише потім перехід;
- при `Скасувати` перехід скасовується;
- при `Перейти без збереження` перехід виконується одразу.

Файл: `admin.html`

- Додано новий діалог:
- `#settings-unsaved-modal`
- Додано кнопки дій та primary-button:
- `#settings-unsaved-save-btn`
- `resolveSettingsUnsavedNavigation('save'|'discard'|'cancel')`
- Додано клік по backdrop для скасування:
- `handleSettingsUnsavedBackdropClick(event)`

Файл: `admin.js`

- Додано modal-controller функції:
- `showSettingsUnsavedNavigationModal()`
- `resolveSettingsUnsavedNavigation(action)`
- `handleSettingsUnsavedBackdropClick(event)`
- Оновлено `showSection(section)` для async-рішення по modal-діям.
- Оновлено `saveSettings(options)`:
- додано `notifySuccess` (default `true`),
- повертає `true/false` для контрольованого переходу після save.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

Користувач отримав повноцінний сценарій роботи з незбереженими змінами в `settings` без втрати контексту і без примусових рішень.
