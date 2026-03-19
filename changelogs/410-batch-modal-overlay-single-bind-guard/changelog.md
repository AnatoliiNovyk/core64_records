# Batch 410: Modal Overlay Single-Bind Guard

## Як було
- Click-listener для overlay модалки міг бути повторно зареєстрований при повторній ініціалізації скрипта.
- Це могло призводити до дубльованих callback-ів закриття.

## Що зроблено
- У блоці реєстрації listener для `modalOverlayEl` додано одноразовий guard через dataset:
  - `if (!modalOverlayEl.dataset.overlayClickListenerBound) { ... }`
  - після bind: `modalOverlayEl.dataset.overlayClickListenerBound = "1"`

## Що покращило / виправило / додало
- Усунуто ризик множинної реєстрації backdrop-click handler-а.
- Покращено передбачуваність closeModal-flow при повторному bootstrap.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
