# Changelog - 2026-03-17 - Audit auto-refresh pause on hidden tab

## Що зроблено
- Додано інтеграцію з Page Visibility API для секції аудиту.
- Коли вкладка стає неактивною:
  - автооновлення аудиту зупиняється,
  - активний audit-запит скасовується,
  - badge показує стан паузи.
- Коли вкладка знову активна:
  - автооновлення відновлюється,
  - виконується одне негайне оновлення аудиту.

## Технічні зміни
- Файл: `admin.js`
- Оновлено `updateAuditRefreshBadge()`:
  - додано стан `пауза (вкладка неактивна)`.
- Оновлено `setupAuditAutoRefresh()`:
  - при `document.hidden === true` таймери не запускаються.
- Додано `handleAuditVisibilityChange()`:
  - на hidden: `cancelAuditRequest()`, `stopAuditAutoRefresh()`, `updateAuditRefreshBadge()`.
  - на visible: `setupAuditAutoRefresh()` + `loadAuditLogs()`.
- У `DOMContentLoaded` додано listener:
  - `document.addEventListener('visibilitychange', handleAuditVisibilityChange)`.

## Валідація
- Статична перевірка `admin.js`: без помилок.
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Менше фонових запитів при неактивній вкладці.
- Після повернення користувач одразу бачить свіжий аудит і відновлений автоцикл.