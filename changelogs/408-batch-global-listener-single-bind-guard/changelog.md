# Batch 408: Global Listener Single-Bind Guard

У `DOMContentLoaded` глобальні listener-и (`visibilitychange`, `keydown`, `blur/focus`, `beforeunload`) реєструвались без guard-а від повторного bind.
При повторній ініціалізації скрипта могло з’явитися дублювання обробників.

Додано глобальний прапорець:

- `let globalEventListenersBound = false;`

Реєстрацію глобальних listener-ів обгорнуто умовою:

- `if (!globalEventListenersBound) { ...; globalEventListenersBound = true; }`

Унеможливлено дубльований bind глобальних обробників при повторному запуску bootstrap-логіки.
Зменшено ризик повторних side-effect (подвійні hotkey/visibility callbacks).

Diagnostics check for `admin.js`: **No errors found**.
