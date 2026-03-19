# Batch 383: Section Loaders Navigation Sequence Guards

## Як було
- Секційні loader-функції (`loadReleases`, `loadArtists`, `loadEvents`, `loadSettings`, `loadContacts`) перевіряли секцію, але не мали `sectionNavigationSeq`-guard.
- `loadAuditLogs` мав `requestSeq` і section/DOM перевірки, але не враховував зміну навігаційного покоління при same-section roundtrip.

## Що зроблено

### 1) Додано `sectionNavigationSeq` у секційні loaders
- У кожній функції додано захоплення токена:
  - `const navigationSeqAtLoad = sectionNavigationSeq;`
- Додано перевірку одразу після `await`:
  - `if (sectionNavigationSeq !== navigationSeqAtLoad) return;`
- Охоплено:
  - `loadReleases`
  - `loadArtists`
  - `loadEvents`
  - `loadSettings`
  - `loadContacts`

### 2) Посилено `loadAuditLogs`
- Додано `navigationSeqAtLoad` на старті.
- У `catch` після `Promise.all` додано early-return для stale navigation generation;
  якщо запит ще актуальний по `requestSeq`, виконується коректне скидання `auditRequestController` і `setAuditLoading(false)`.
- Після перевірки `requestSeq` додано окрему перевірку `sectionNavigationSeq` перед застосуванням результатів у cache/DOM.

## Що покращило / виправило / додало
- Знижено ризик застосування застарілих відповідей loader-функцій після швидкої навігації з поверненням у ту ж секцію.
- `loadAuditLogs` тепер захищений одночасно двома рівнями:
  - per-request (`auditRequestSeq`)
  - per-navigation generation (`sectionNavigationSeq`)
- Підвищено детермінованість UI-стану при інтенсивних переходах секціями.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
