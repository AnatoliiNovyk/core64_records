# Changelog

## Added

Implemented `toastEl.isConnected` guard in `handleSettingsUnsavedToastFocusOut` to prevent executing focus out logic when the toast element has been unmounted or disconnected from the DOM. This protects `resumeSettingsUnsavedToastAutoClose` from triggering incorrectly in disconnected states.
