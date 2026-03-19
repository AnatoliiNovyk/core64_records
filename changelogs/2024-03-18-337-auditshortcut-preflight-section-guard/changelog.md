# Change Log

## 2024-03-18 #337
- Hardened `handleAuditKeyboardShortcuts` with a preflight connected `section-audit` guard before `event.preventDefault()` and async refresh flow.
- Prevented starting shortcut refresh side-effects when audit section is already detached.
- Preserved existing shortcut behavior for active, connected audit context.
