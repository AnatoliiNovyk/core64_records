# 363 batch contacts cache context guards

Batch fixes in admin.js:

1) changeContactStatus
- Added context checks before and after contact list refetch.
- Applied cache update only when section context is still active (`contacts`).

2) bulkUpdateContactStatus
- Added context checks before and after contact list refetch.
- Applied cache update only when section context is still active (`contacts`).

Effect:
- Prevents stale contact cache mutations after navigation away from contacts during async status operations.
- Keeps UI behavior unchanged in active contacts section.
