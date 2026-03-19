# Change Log

## 2024-03-18 #290
- Hardened `loadReleases` with post-async guards after loading release data.
- Added checks for active `releases` section and connected `section-releases` before rendering `releases-list`.
- Prevented stale release-list rendering when users navigate away during async collection fetch.
