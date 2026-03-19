# Batch 380: Dashboard/Settings Navigation Sequence Guards

## Summary
Extended `sectionNavigationSeq` hardening to dashboard cache/render and settings save flows to prevent stale async completions from applying after navigation changes, including same-section roundtrips.

## Як було
- `refreshCache` і `saveSettings` покладались лише на перевірки `currentSection`.
- Якщо користувач встиг перейти в іншу секцію і повернутись назад у ту саму, старий async-ланцюг теоретично міг пройти перевірки по рядку секції.

## Що зроблено

### 1) `refreshCache` — додано navigation token перевірки
- Захоплено `const navigationSeqAtRefresh = sectionNavigationSeq;`.
- Додано `sectionNavigationSeq`-перевірки після кожного `await adapter.getCollection(...)`.
- Додано фінальну перевірку перед записом у `cache`.

### 2) `loadDashboard` — перевірка після `await refreshCache()`
- Захоплено `const navigationSeqAtLoad = sectionNavigationSeq;`.
- Додано перевірку після повернення з `refreshCache` перед будь-якими DOM-оновленнями.

### 3) `saveSettings` — захист після збереження і в catch
- Захоплено `const navigationSeqAtSave = sectionNavigationSeq;`.
- Додано перевірку одразу після `await adapter.saveCollection(...)`.
- Додано таку ж перевірку в `catch` перед error/UI handling.

## Що покращило / виправило / додало
- Зменшено ризик застосування застарілих async-результатів у dashboard/settings після швидких переходів між секціями.
- Поведінка стала більш детермінованою при сценаріях навігації типу "пішов/повернувся в ту саму секцію".

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
