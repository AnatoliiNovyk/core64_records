# Batch 387: Audit Latency Thresholds Navigation Sequence Guard

## Як було
- `loadAuditLatencyThresholdsFromSettings` перевіряв лише `currentSection` після `await adapter.getCollection("settings")`.
- У сценарії same-section roundtrip старий async-відгук теоретично міг пройти перевірку по назві секції.

## Що зроблено
- Додано capture токена:
  - `const navigationSeqAtLoad = sectionNavigationSeq;`
- Додано перевірки `sectionNavigationSeq`:
  - після `await` у success гілці
  - у catch перед fallback `applyAuditLatencyThresholds({})`

## Що покращило / виправило / додало
- Функція стала консистентною з рештою навігаційно-захищених async-flow у `admin.js`.
- Зменшено ризик застосування stale threshold-даних після швидкої зміни навігаційного контексту.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
