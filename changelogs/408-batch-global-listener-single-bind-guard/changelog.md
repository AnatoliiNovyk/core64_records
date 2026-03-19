# Batch 408: Global Listener Single-Bind Guard

## Як було
- У `DOMContentLoaded` глобальні listener-и (`visibilitychange`, `keydown`, `blur/focus`, `beforeunload`) реєструвались без guard-а від повторного bind.
- При повторній ініціалізації скрипта могло з’явитися дублювання обробників.

## Що зроблено
- Додано глобальний прапорець:
  - `let globalEventListenersBound = false;`
- Реєстрацію глобальних listener-ів обгорнуто умовою:
  - `if (!globalEventListenersBound) { ...; globalEventListenersBound = true; }`

## Що покращило / виправило / додало
- Унеможливлено дубльований bind глобальних обробників при повторному запуску bootstrap-логіки.
- Зменшено ризик повторних side-effect (подвійні hotkey/visibility callbacks).

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
