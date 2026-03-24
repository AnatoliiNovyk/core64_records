# Changelog - 2026-03-18 - Settings unsaved toast progress bar

`settings-unsaved` toast мав лише текст і бейдж черги.
Користувач не бачив, скільки часу залишилось до автозакриття повідомлення.

Файл: `admin.html`

- До `#settings-unsaved-toast` додано візуальний progress bar:
- контейнер прогресу;
- елемент `#settings-unsaved-toast-progress`.

Файл: `admin.js`

- Додано функції керування прогресом:
- `setSettingsUnsavedToastProgress(remainingMs, transitionMs)`;
- `animateSettingsUnsavedToastProgress(transitionMs)`.
- Інтегровано прогрес із таймером автозакриття:
- у `scheduleSettingsUnsavedToastAutoClose()` прогрес стартує і анімується до 0;
- у `pauseSettingsUnsavedToastAutoClose()` прогрес фіксується на залишку;
- у `resumeSettingsUnsavedToastAutoClose()` прогрес відновлює анімацію;
- у `finalizeSettingsUnsavedToastDisplay()` прогрес скидається.
- Додано зміну кольору progress bar за тоном toast (warn/success).

Додано прозорий таймінг-фідбек: користувач бачить, коли повідомлення зникне.
Краще UX при hover/focus: прогрес дійсно паузиться і продовжується з залишку.
Підсилено узгодженість поточного toast-flow (пріоритети, дедуплікація, queue-limit, manual dismiss, queue badge).

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
