# Change Log

Hardened `loadReleases` with post-async guards after loading release data.
Added checks for active `releases` section and connected `section-releases` before rendering `releases-list`.
Prevented stale release-list rendering when users navigate away during async collection fetch.
