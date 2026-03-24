# Changelog

## Added

Strengthened modal state checks by requiring `settings-unsaved-modal` to be connected in `isSettingsUnsavedModalOpen`.
Added early return for disconnected `settings-unsaved-modal` in `getSettingsUnsavedModalFocusableElements` to avoid querying detached DOM nodes during keyboard trap logic.
