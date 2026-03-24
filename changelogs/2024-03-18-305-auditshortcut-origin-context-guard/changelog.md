# Change Log

Hardened `handleAuditKeyboardShortcuts` by capturing shortcut origin section context.
Added a post-async guard to stop shortcut continuation when section context changes before refresh completes.
Preserved existing shortcut behavior for active audit section.
