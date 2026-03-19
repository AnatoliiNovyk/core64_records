# 357 batch activity context guards

Batch fixes in admin.js:

1) bulkUpdateContactStatus no-target path
- Added connected contacts-list check before showing "no targets" alert (symmetry with other contacts guards).

2) modal form submit success path
- Added post-await section/context/isConnected checks before addActivity call.

3) deleteItem success path
- Added post-await section/context/isConnected checks before addActivity call.

Effect:
- Prevents stale activity logging and residual alerts when async success paths resolve after section transitions.
- Keeps active-context behavior unchanged.
