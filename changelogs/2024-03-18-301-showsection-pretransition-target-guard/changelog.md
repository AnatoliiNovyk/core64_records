# Change Log

## 2024-03-18 #301
- Hardened `showSection` with a pre-transition target section availability guard.
- Added an early return when `section-${section}` is missing or detached before calling `setActiveSection(section)`.
- Prevented starting section transition flows for unavailable target containers.
