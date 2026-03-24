# Batch 387: Audit Latency Thresholds Navigation Sequence Guard

`loadAuditLatencyThresholdsFromSettings` перевіряв лише `currentSection` після `await adapter.getCollection("settings")`.
У сценарії same-section roundtrip старий async-відгук теоретично міг пройти перевірку по назві секції.

Додано capture токена:

- `const navigationSeqAtLoad = sectionNavigationSeq;`

Додано перевірки `sectionNavigationSeq`:

- після `await` у success гілці
- у catch перед fallback `applyAuditLatencyThresholds({})`

Функція стала консистентною з рештою навігаційно-захищених async-flow у `admin.js`.
Зменшено ризик застосування stale threshold-даних після швидкої зміни навігаційного контексту.

Diagnostics check for `admin.js`: **No errors found**.
