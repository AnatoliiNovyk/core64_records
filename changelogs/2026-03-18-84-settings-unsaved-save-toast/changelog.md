# Changelog - 2026-03-18 - Settings unsaved save toast

## Що зроблено
- Додано симетричний toast для гілки `Зберегти і перейти` у modal незбережених змін.
- Тепер обидва сценарії мають явний фідбек:
  - `discard` -> попереджувальний toast;
  - `save` -> success toast.

## Технічні зміни
- Файл: `admin.js`
  - Розширено `showSettingsUnsavedToast(message, tone = "warn")`:
    - підтримує тон `warn` і `success` через динамічні класи.
  - У `showSection(section)`:
    - після успішного `saveSettings({ notifySuccess: false })` показує:
      - `showSettingsUnsavedToast("Зміни порогів збережено", "success")`
    - для `discard` явно передає tone `warn`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`

## Результат
- UX став консистентнішим: після будь-якого вибору в modal користувач отримує чітке підтвердження дії.
