# Change Log

Hardened `showSection` unsaved-settings modal flow with post-await `currentSection` guards.
Added a guard right after `showSettingsUnsavedNavigationModal()` and after `saveSettings()` before handling decision outcomes.
Prevented stale modal decisions/toasts from being applied if section context changes mid-flow.
