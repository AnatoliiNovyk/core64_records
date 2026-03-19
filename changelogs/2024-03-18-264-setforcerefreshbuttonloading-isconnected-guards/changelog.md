# Change Log

## 2024-03-18 #264
- Hardened `setForceRefreshButtonLoading` with `isConnected` checks for force-refresh label and spinner updates.
- Prevented detached-node mutations for `textContent` and `classList.toggle` during async force-refresh flow.
- Kept existing loading-state behavior and UI copy unchanged.
