# 349 modal submit catch context guard

Added origin section capture in modal form submit handler.
Added catch-branch guard checks (section unchanged + section container connected) before showing save failure alert.
Prevents stale modal save error alerts after section navigation during async save.
