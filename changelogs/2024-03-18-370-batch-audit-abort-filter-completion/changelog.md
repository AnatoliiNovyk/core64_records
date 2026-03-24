# 370 batch audit abort filter completion

Batch fixes in admin.js:

1) Added `isAbortError` filters in remaining audit load catch handlers:
changeAuditLimit
clearAuditFilters
resetAuditPageAndRender
changeAuditPage

2) exportAuditCsv catch branch
Added `isAbortError` early return.
Moved error logging after context/isConnected guards for cleaner signal.

Effect:
Completes abort-aware error handling across the main audit filter/pagination/limit flows.
Reduces noisy logs and avoids stale error UI on expected request cancellation.
