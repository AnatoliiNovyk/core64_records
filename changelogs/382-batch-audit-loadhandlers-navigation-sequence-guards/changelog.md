# Batch 382: Audit `loadAuditLogs` Handlers Navigation Sequence Guards

## Як було
- Частина audit-хендлерів, що запускають `loadAuditLogs()` через таймери/`.catch`, перевіряли лише `currentSection` та `isConnected`.
- У сценарії швидкої навігації "вийшов із секції й повернувся назад" старі callback-и могли теоретично пройти ці перевірки.

## Що зроблено

### 1) `setupAuditAutoRefresh`
- Додано `const navigationSeqAtSetup = sectionNavigationSeq;`.
- У `setInterval` додано early-stop, якщо `sectionNavigationSeq` змінився.
- У `.catch` від `loadAuditLogs()` додано перевірку токена перед error handling.

### 2) `handleAuditVisibilityChange`
- Додано `const navigationSeqAtVisibility = sectionNavigationSeq;`.
- У `.catch` після `loadAuditLogs()` додано перевірку токена.

### 3) `changeAuditLimit`
- Додано `const navigationSeqAtChange = sectionNavigationSeq;`.
- У `.catch` після `loadAuditLogs()` додано перевірку токена.

### 4) `clearAuditFilters`
- Додано `const navigationSeqAtClear = sectionNavigationSeq;`.
- У `.catch` після `loadAuditLogs()` додано перевірку токена.

### 5) `resetAuditPageAndRender`
- Додано `const navigationSeqAtReset = sectionNavigationSeq;`.
- У `.catch` після `loadAuditLogs()` додано перевірку токена.

### 6) `changeAuditPage`
- Додано `const navigationSeqAtPageChange = sectionNavigationSeq;`.
- У `.catch` після `loadAuditLogs()` додано перевірку токена.

## Що покращило / виправило / додало
- Посилено захист від stale async callback-ів у ключових audit-хендлерах.
- Зменшено ризик неактуальних UI/error-ефектів після зміни навігаційного контексту.
- Уніфіковано підхід guard-ів із раніше введеним `sectionNavigationSeq`.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
