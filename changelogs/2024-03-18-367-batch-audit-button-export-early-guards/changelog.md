# 367 batch audit button/export early guards

Batch fixes in admin.js:

1) setRefreshNowButtonLoading
- Added audit section context + connected section guard before label/spinner UI mutation.

2) setForceRefreshButtonLoading
- Added audit section context + connected section guard before label/spinner UI mutation.

3) exportAuditCsv
- Added early section/context/isConnected guard before building request params and sending export API call.
- Reused captured section reference in async success handler.

Effect:
- Prevents stale loading button label/spinner updates outside active audit context.
- Avoids unnecessary export requests when audit context is already invalid.
