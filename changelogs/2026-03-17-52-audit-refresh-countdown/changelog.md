# Changelog - 2026-03-17 - Audit auto-refresh countdown

## Що зроблено
- Додано живий зворотний відлік до наступного автооновлення журналу аудиту.
- Розділено логіку автооновлення на 2 таймери:
  - таймер виконання refresh,
  - таймер UI-відліку (крок 1 секунда).
- Оновлено `audit-refresh-status` для показу формату:
  - `Автооновлення: через Ns (кожні Ms)`.
- Після ручного/автоматичного успішного завантаження аудиту відлік скидається на повний інтервал.

## Технічні зміни
- Файл: `admin.js`
- Додано стан:
  - `auditRefreshCountdownTimer`
  - `auditRefreshRemainingSec`
- Оновлено функції:
  - `stopAuditAutoRefresh()` — очищає обидва таймери та скидає countdown.
  - `updateAuditRefreshBadge()` — показує live countdown у секції аудиту.
  - `setupAuditAutoRefresh()` — запускає countdown-інтервал + refresh-інтервал.
  - `loadAuditLogs()` — після успішного завантаження скидає countdown.
- Додано допоміжну функцію:
  - `resetAuditRefreshCountdown(seconds)`.

## Валідація
- Статична перевірка `admin.js`: без помилок.
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Користувач в адмінці бачить, коли саме відбудеться наступне автооновлення аудиту, що покращує передбачуваність і контроль UX.