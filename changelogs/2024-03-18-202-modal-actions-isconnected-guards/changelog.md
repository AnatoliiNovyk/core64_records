# Changelog

## Added

Strengthened modal lifecycle functions (`showSettingsUnsavedNavigationModal` and `resolveSettingsUnsavedNavigation`) by requiring `settings-unsaved-modal` to be connected before attempting to modify its class list. This prevents errors and unwanted visual states when responding to events on detached modals.
