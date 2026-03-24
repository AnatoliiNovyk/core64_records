# Batch 407: Modal Overlay Backdrop Click Defensive Guards

Закриття модалки по кліку на overlay покладалось на просту перевірку `e.target.id === "modal"`.
Не було повного набору перевірок валідності події/цілей, що знижувало надійність у edge-case подіях.

У click-handler `modalOverlayEl` додано defensive guard-и:

- `!e` / `e.defaultPrevented`
- `currentTarget/target.isConnected === false`
- `e.target !== e.currentTarget` (ігнор внутрішніх кліків)
- обмеження на primary button (`e.button === 0`, якщо доступно)

Після проходження guard-ів виконується `closeModal()`.

Надійніше backdrop-закриття модалки лише для валідного кліку по overlay.
Зменшено ризик небажаних close side-effect від нецільових/частково невалідних подій.

Diagnostics check for `admin.js`: **No errors found**.
