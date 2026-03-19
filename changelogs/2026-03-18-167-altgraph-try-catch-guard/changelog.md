# Changelog #167: AltGraph getModifierState try/catch hardening

## Було
- `hasSettingsUnsavedModifierKeys(event)` викликав `event.getModifierState("AltGraph")` без локального перехоплення винятків.
- У нестандартних/synthetic keyboard events це потенційно могло кинути runtime помилку і зламати guard flow.

## Зміна
- Додано захисний `try/catch` навколо `getModifierState("AltGraph")` у `hasSettingsUnsavedModifierKeys(event)`.
- При винятку fallback на `hasAltGraph = false`.

## Стало краще
- Shared keydown guard став стійкішим до нестандартних event-обʼєктів.
- Менший ризик runtime-винятків під час keyboard обробки в edge-кейсах.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function hasSettingsUnsavedModifierKeys(event)` присутня
  - `getModifierState("AltGraph")` обгорнуто в `try/catch`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
