# Changelog

## Added

Hardened `saveSettings` by validating `setting-audit-latency-good-max` and `setting-audit-latency-warn-max` presence/connectivity before reading values, and by guarding post-save input value writes with `isConnected` checks.
