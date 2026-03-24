# 350 batch async context guards 01

Batch contains multiple small hardening fixes in admin.js:

1) clearAuditFilters catch branch:
Added section/context/isConnected guards before forwarding error to handleAuditLoadError.

2) exportAuditCsv empty-result path inside async then:
Added section/context/isConnected guards before showing "no records" alert.

3) handleFileUpload asynchronous FileReader callbacks:
Captured section at upload start.
Added section guard in reader.onload before DOM updates.
Added section + input connectivity guards in reader.onerror before alert.

Result:
Fewer stale UI side-effects from async callbacks after section changes.
No functional change in active valid context.
