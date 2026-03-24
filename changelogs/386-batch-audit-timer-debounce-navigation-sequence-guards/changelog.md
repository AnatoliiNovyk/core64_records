# Batch 386: Audit Timer/Debounce Navigation Sequence Guards

`setupAuditAutoRefresh` мав `sectionNavigationSeq`-guard для auto-refresh interval, але countdown interval ще покладався лише на section/DOM перевірки.
`handleAuditSearchInput` debounce callback не перевіряв `sectionNavigationSeq`.

## Що зроблено

## 1) Countdown interval guard у `setupAuditAutoRefresh`

Додано перевірку на початку `auditRefreshCountdownTimer` callback:

- якщо `sectionNavigationSeq` змінився, викликається `stopAuditAutoRefresh()` і callback завершується.

## 2) Debounce guard у `handleAuditSearchInput`

Додано capture:

- `const navigationSeqAtInput = sectionNavigationSeq;`

У `setTimeout` callback додано early-return:

- `if (sectionNavigationSeq !== navigationSeqAtInput) return;`

Закрито додаткові stale-вікна для таймерів/дебаунсу в audit-флоу при same-section roundtrip сценаріях.
Уніфіковано поведінку timer callbacks з уже впровадженою navigation sequence стратегією.

Diagnostics check for `admin.js`: **No errors found**.
