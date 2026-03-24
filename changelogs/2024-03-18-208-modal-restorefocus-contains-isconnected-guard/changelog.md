# Changelog

## Added

Hardened deferred focus restore in `resolveSettingsUnsavedNavigation` by requiring `settings-unsaved-modal` to be connected before running `contains(previous)` checks in the `requestAnimationFrame` callback.
