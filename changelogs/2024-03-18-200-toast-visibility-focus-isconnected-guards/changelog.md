# Changelog

## Added

Implemented `toastEl.isConnected` guards in `handleSettingsUnsavedToastVisibilityChange`, `handleSettingsUnsavedToastWindowBlur`, and `handleSettingsUnsavedToastWindowFocus` to ensure auto-close pausing/resuming logic only runs when the toast element is actually in the DOM.
