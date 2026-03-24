# Batch 410: Modal Overlay Single-Bind Guard

Click-listener для overlay модалки міг бути повторно зареєстрований при повторній ініціалізації скрипта.
Це могло призводити до дубльованих callback-ів закриття.

У блоці реєстрації listener для `modalOverlayEl` додано одноразовий guard через dataset:

- `if (!modalOverlayEl.dataset.overlayClickListenerBound) { ... }`
- після bind: `modalOverlayEl.dataset.overlayClickListenerBound = "1"`

Усунуто ризик множинної реєстрації backdrop-click handler-а.
Покращено передбачуваність closeModal-flow при повторному bootstrap.

Diagnostics check for `admin.js`: **No errors found**.
