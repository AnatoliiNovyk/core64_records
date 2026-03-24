# 346 bulkUpdateContactStatus catch context guard

Added section/context and connected contacts DOM checks in the bulkUpdateContactStatus catch branch before showing the failure alert.
Prevents stale error alerts after leaving contacts while async bulk status update rejects.
Keeps visible behavior unchanged for active contacts view.
