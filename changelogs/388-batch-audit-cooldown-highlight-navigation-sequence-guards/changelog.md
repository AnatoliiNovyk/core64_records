# Batch 388: Audit Cooldown/Highlight Navigation Sequence Guards

`startManualAuditRefreshCooldown` та `pulseAuditRefreshSuccess` використовували `setTimeout` без `sectionNavigationSeq`-перевірки.
У сценаріях швидкої навігації stale timeout callback-и могли відпрацювати в неактуальному контексті.

## Що зроблено

## 1) `startManualAuditRefreshCooldown`

Додано capture:

- `const navigationSeqAtCooldown = sectionNavigationSeq;`

У timeout callback додано early-return при зміні navigation generation.
При stale callback коректно скидаються:

- `manualAuditRefreshCooldownActive = false`
- `manualAuditRefreshCooldownTimer = null`

## 2) `pulseAuditRefreshSuccess`

Додано capture:

- `const navigationSeqAtPulse = sectionNavigationSeq;`

У timeout callback додано перевірку sequence перед UI-зняттям highlight.
При stale callback таймер очищає власний state без side-effect на DOM.

Усунуто ще один клас stale таймер-ефектів у manual refresh UX audit секції.
Підвищено консистентність таймерних guard-ів з загальною `sectionNavigationSeq` стратегією.

Diagnostics check for `admin.js`: **No errors found**.
