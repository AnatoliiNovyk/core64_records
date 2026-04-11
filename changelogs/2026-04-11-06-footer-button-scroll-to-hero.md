# 2026-04-11-06 Footer Button Scroll To Hero

## Previous state
- The public footer did not provide a direct way to return to the first section of the site.
- Users had to manually scroll back up from the lower sections.
- Existing smooth-scroll behavior existed, but there was no footer control wired to it.

## What was changed
- Updated index.html:
  - Added an explicit Hero anchor id: id="hero".
  - Added a new footer button that triggers scrollToSection("hero") for smooth return to the top section.
  - Added accessibility bindings on the button: data-i18n-aria-label and data-i18n-title.
- Updated app.js:
  - Added i18n keys for UK/EN button text and aria/title label:
    - footerBackToTop
    - footerBackToTopAria

## Resulting improvement
- Users can jump from footer to Hero in one click without manual long scrolling.
- The new footer control is localized for both supported languages.
- The implementation reuses existing smooth-scroll logic, reducing regression risk.
