# Change Log

## 2024-03-18 #308
- Hardened `loadDashboard`, `loadReleases`, `loadArtists`, `loadEvents`, and `loadSettings` with origin-context capture.
- Added post-await `currentSection` equality guards in each loader to stop stale async continuations.
- Preserved existing per-section DOM guards and rendering logic while improving symmetry across loaders.
