# Change Log

## 2024-03-18 #263
- Hardened `setRefreshNowButtonLoading` with `isConnected` checks for refresh label and spinner mutations.
- Prevented `textContent` and `classList.toggle` operations on detached UI nodes during async refresh transitions.
- Preserved button loading behavior and existing UX text/spinner semantics.
