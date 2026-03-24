# Change Log

Hardened `populateAuditFilterOptions` with additional `isConnected` re-checks before select `innerHTML` updates and before final `value` assignments.
Prevented detached-element mutations if filter controls unmount between initial guard and later writes.
Preserved existing option generation and selected-value restoration behavior.
