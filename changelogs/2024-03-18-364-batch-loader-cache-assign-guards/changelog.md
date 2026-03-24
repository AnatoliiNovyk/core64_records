# 364 batch loader cache assign guards

Batch fixes in admin.js:

1) loadReleases
Switched to local fetch variable (`nextReleases`) and assigned to cache only after section/context guards.

2) loadArtists
Switched to local fetch variable (`nextArtists`) and assigned to cache only after section/context guards.

3) loadEvents
Switched to local fetch variable (`nextEvents`) and assigned to cache only after section/context guards.

4) loadSettings
Switched to local fetch variable (`nextSettings`) and assigned to cache only after section/context guards.

5) loadContacts
Switched to local fetch variable (`nextContactRequests`) and assigned to cache only after section/context guards.

Effect:
Prevents stale cache mutation in section-specific loaders when user navigates during async fetch.
Preserves behavior in active valid section context.
