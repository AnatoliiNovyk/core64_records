# Changelog - 2026-03-17 - Audit eco mode

Додано перемикач `Економний режим` у секцію журналу аудиту.
В економному режимі автооновлення не запускає періодичні таймери, навіть якщо інтервал заданий.
Дані аудиту в eco mode оновлюються вручну (кнопка оновлення) або через зміни фільтрів (існуюча логіка).
Стан eco mode зберігається в `sessionStorage` разом з іншими налаштуваннями аудиту.

Файл: `admin.html`

- Додано checkbox `#audit-eco-mode` з `onchange="toggleAuditEcoMode()"`.

Файл: `admin.js`

- `saveAuditUiState()` тепер зберігає `ecoMode`.
- `loadAuditUiState()` відновлює `ecoMode` у checkbox.
- Додано `isAuditEcoModeEnabled()`.
- `updateAuditRefreshBadge()` показує статус:
- `Автооновлення: економний режим (вручну, інтервал Ns)`.
- `setupAuditAutoRefresh()` не стартує таймери при `ecoMode=true`.
- Додано `toggleAuditEcoMode()` для миттєвого застосування режиму.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Знижено зайвий трафік та фонову активність для користувачів, яким не потрібне періодичне автооновлення аудиту.
