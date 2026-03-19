# Changelog #194: Guard backdrop handler by target connectivity

## Було
- `handleSettingsUnsavedBackdropClick()` вже мав guards для open-state, `defaultPrevented`, `currentTarget` connectivity, button type, direct-click і target id.
- Але не було окремої перевірки на відʼєднаний `event.target`.

## Зміна
- Додано додатковий guard:
  - `if (event.target && event.target.isConnected === false) return;`
- Інша логіка backdrop dismiss flow не змінена.

## Стало краще
- Менше ризику обробляти клік зі stale `event.target` у міжподійних DOM race-сценаріях.
- Надійніша стабільність backdrop interaction без зміни UX.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у `handleSettingsUnsavedBackdropClick()` присутній `event.target.isConnected === false` guard
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
