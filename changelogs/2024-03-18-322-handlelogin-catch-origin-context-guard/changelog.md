# Change Log

Hardened `handleLogin` by capturing origin section context at login start.
Added a catch-path guard to stop stale login error UI updates when section context changes during async auth.
Preserved existing login error logging and connected-element checks.
