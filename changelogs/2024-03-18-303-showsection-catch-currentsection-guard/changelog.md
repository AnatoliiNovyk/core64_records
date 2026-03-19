# Change Log

## 2024-03-18 #303
- Hardened `showSection` catch flow with a `currentSection` guard before calling `showApiStatus(...)`.
- Prevented stale section load failures from showing API error banners after user navigates elsewhere.
- Preserved existing error reporting for the currently active section.
