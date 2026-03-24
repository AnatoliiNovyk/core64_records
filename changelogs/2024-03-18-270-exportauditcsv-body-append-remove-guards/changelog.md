# Change Log

Hardened `exportAuditCsv` by guarding temporary download link append/remove operations with connected `document.body` checks.
Preserved download trigger (`link.click`) and URL cleanup (`URL.revokeObjectURL`) while preventing detached-body DOM mutations.
Kept CSV export behavior unchanged in normal connected-document scenarios.
