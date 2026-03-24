# Change Log

Hardened `changeContactsPage` by adding a connected-container guard before updating `contactsPage`.
Prevented page-state mutations when the contacts list is detached during section transitions.
Preserved existing pagination behavior when contacts UI is active.
