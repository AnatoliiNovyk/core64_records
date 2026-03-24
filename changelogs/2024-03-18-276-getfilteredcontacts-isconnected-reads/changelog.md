# Change Log

Hardened `getFilteredContacts` by reading status/date/search filter controls only when elements are connected.
Added safe fallback values for detached/missing controls to prevent stale DOM reads.
Preserved existing contacts filtering behavior.
