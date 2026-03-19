# Changelog - 2026-03-18 - Settings unsaved toast reduced motion

## Як було
- Progress bar у `settings-unsaved` toast завжди анімувався з лінійною зміною ширини.
- Налаштування системи `prefers-reduced-motion` не враховувалось.

## Що зроблено
- Файл: `admin.js`
  - Додано `prefersReducedMotion()` для перевірки системної motion-preference.
  - Оновлено `animateSettingsUnsavedToastProgress(transitionMs)`:
    - якщо увімкнено `prefers-reduced-motion: reduce`, progress bar не анімується;
    - логіка таймера автозакриття при цьому не змінюється.

## Що покращило
- Підвищено доступність для користувачів, чутливих до анімацій.
- Збережено поведінкову сумісність toast-системи: час життя, pause/resume, manual dismiss, queue-поведінка.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
