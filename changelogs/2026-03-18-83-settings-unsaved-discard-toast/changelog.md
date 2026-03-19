# Changelog - 2026-03-18 - Settings unsaved discard toast

## Що зроблено
- Додано явний toast-фідбек після дії `Перейти без збереження` у modal незбережених змін.
- Toast підтверджує, що зміни порогів були відкинуті.

## Технічні зміни
- Файл: `admin.html`
  - Додано toast-контейнер:
    - `#settings-unsaved-toast`

- Файл: `admin.js`
  - Додано `showSettingsUnsavedToast(message)`:
    - показує toast з `aria-live="polite"`;
    - автоховає повідомлення через timeout.
  - Оновлено `showSection(section)`:
    - при рішенні `discard` викликає toast:
      - `Незбережені зміни порогів відкинуто`

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- Після відмови від збереження користувач отримує чітке, ненав'язливе підтвердження виконаної дії.
