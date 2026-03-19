# Change Log

## 2024-03-18 #293
- Hardened `loadSettings` with post-async guards after loading settings collection.
- Added checks for active `settings` section and connected `section-settings` before input value writes.
- Prevented stale settings form writes when users navigate away during async settings fetch.
