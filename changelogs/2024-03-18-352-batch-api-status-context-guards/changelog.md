# 352 batch api status context guards

Batch fixes in admin.js:

1) DOMContentLoaded API availability branch
- Added section/context and connected dashboard section checks before showing API unavailable status.

2) showSection catch branch
- Added connected target section check before showing section-load API error status.

Effect:
- Prevents stale API status messages from async branches after section changes/detached DOM.
- Preserves existing behavior in active valid context.
