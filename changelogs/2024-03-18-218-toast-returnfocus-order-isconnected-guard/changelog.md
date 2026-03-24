# Changelog

## Added

Hardened `updateSettingsUnsavedToastReturnFocus` by moving `toastEl.isConnected` into the primary guard, ensuring connectivity is validated before `contains` checks on the toast container.
