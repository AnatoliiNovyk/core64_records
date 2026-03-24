# 366 batch dashboard bootstrap/refreshCache guards

Batch fixes in admin.js:

1) DOMContentLoaded bootstrap
Made `updateAuditRefreshBadge` and `updateAuditShortcutHint` conditional on unchanged bootstrap section + connected dashboard section.

2) refreshCache
Added early dashboard-context gate before any fetches.
Added dashboard-context and connected-section checks after each await.
Added final guard before assigning fetched data into cache.

Effect:
Avoids unnecessary bootstrap UI updates when context has already changed.
Prevents stale dashboard cache writes and extra fetch work outside active dashboard context.
