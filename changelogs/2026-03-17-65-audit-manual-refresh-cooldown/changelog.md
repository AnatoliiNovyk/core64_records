# Changelog - 2026-03-17 - Audit manual refresh cooldown

## Що зроблено
- Додано короткий cooldown між ручними оновленнями аудиту (`700ms`).
- Cooldown працює для обох кнопок:
  - `Оновити зараз`
  - `Форс-оновлення`
- Під час cooldown обидві кнопки залишаються заблокованими.
- При спробі повторного кліку в cooldown показується toast з залишком часу.

## Технічні зміни
- Файл: `admin.js`
- Додано стани:
  - `manualAuditRefreshInProgress`
  - `manualAuditRefreshCooldownActive`
  - `manualAuditRefreshCooldownTimer`
  - `MANUAL_AUDIT_REFRESH_COOLDOWN_MS = 700`
- Додано helper-функції:
  - `applyManualAuditRefreshButtonsState()`
  - `setManualAuditRefreshInProgress(isInProgress)`
  - `getManualAuditRefreshCooldownRemainingMs()`
  - `startManualAuditRefreshCooldown()`
- Оновлено `refreshAuditNow()` і `forceRefreshAuditNow()`:
  - повертають `boolean` результат (успіх/невиконано);
  - запускають cooldown у `finally`;
  - показують toast при повторному тригері у вікні cooldown.
- Оновлено `handleAuditKeyboardShortcuts(event)`:
  - toast успішного оновлення показується лише якщо `refreshAuditNow()` повернув `true`.

## Валідація
- Статична перевірка:
  - `admin.js`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Поведінка ручних refresh-дій стала більш контрольованою: менше випадкових повторних запусків одразу після завершення запиту.