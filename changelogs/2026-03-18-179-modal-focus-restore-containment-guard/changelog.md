# Changelog #179: Guard focus-restore against hidden modal containment

## Було
- У resolveSettingsUnsavedNavigation відновлення фокусу вже перевіряло isConnected і мало try/catch.
- У рідкісному edge-сценарії previous focus міг вказувати на елемент усередині модалки, яку щойно приховали.

## Зміна
- У callback відновлення фокусу додано guard:
  - if (modalEl && modalEl.contains(previous)) return;
- Бізнес-поведінка не змінена; додано лише safety-перевірку для нестандартного стану DOM.

## Стало краще
- Менше ризику фокусування прихованого елемента модалки.
- Стабільніше відновлення фокусу при швидких переходах і race-сценаріях.

## Валідація
- Diagnostics:
  - admin.js: no errors
  - admin.html: no errors
- Grep confirmation:
  - у resolve flow присутній guard modalEl.contains(previous)
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
