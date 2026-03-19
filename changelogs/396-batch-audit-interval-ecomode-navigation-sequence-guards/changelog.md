# Batch 396: Audit Interval/EcoMode Navigation Sequence Guards

## Як було
- `toggleAuditEcoMode` і `changeAuditRefreshInterval` перевіряли секцію/DOM, але не мали `sectionNavigationSeq`-guard після `setupAuditAutoRefresh()`.
- У same-section roundtrip сценарії stale continuation могла теоретично пройти перевірки по назві секції.

## Що зроблено
- У `toggleAuditEcoMode`:
  - додано `const navigationSeqAtToggle = sectionNavigationSeq;`
  - додано перевірку `sectionNavigationSeq` одразу після `setupAuditAutoRefresh()`.
- У `changeAuditRefreshInterval`:
  - додано `const navigationSeqAtChange = sectionNavigationSeq;`
  - додано перевірку `sectionNavigationSeq` одразу після `setupAuditAutoRefresh()`.

## Що покращило / виправило / додало
- Зменшено ризик stale UI-updates для refresh badge після навігаційних змін.
- Уніфіковано guard-поведінку з рештою audit async/timer хендлерів.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
