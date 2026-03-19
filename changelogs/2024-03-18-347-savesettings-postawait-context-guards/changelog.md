# 347 saveSettings post-await context guards

- Added origin section capture in saveSettings and post-await guards before activity/success alert updates.
- Added matching context and connected section checks in catch branch before showing failure alert.
- Prevents stale settings notifications when save resolves/rejects after navigating away from settings.
