# Changelog #188: Harden modal focusable-elements collection

## Було
- `getSettingsUnsavedModalFocusableElements()` відфільтровував елементи лише за `disabled` і `aria-hidden`.
- У рідкісних edge-сценаріях список теоретично міг містити відʼєднані або нефокусовані таргети.

## Зміна
- Посилено filter у collection helper:
  - додано `el.isConnected`
  - додано `typeof el.focus === "function"`
- Інша логіка не змінена.

## Стало краще
- Стабільніший набір елементів для focus-trap.
- Менше ризику edge-винятків під час Tab-циклювання у modal keyboard flow.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у `getSettingsUnsavedModalFocusableElements()` присутній filter із `el.isConnected` і `typeof el.focus === "function"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
