# 2026-04-11-07 Floating Scroll-Top Button

## Previous state
- The previously added button was placed inside the footer.
- The control did not satisfy the updated requirement for a floating button that remains available while scrolling.
- Returning to the top depended on reaching footer context first.

## What was changed
- Updated index.html to move the scroll-top control from footer layout to a dedicated floating button.
- Added a new fixed-position button with id="floating-scroll-top" that calls scrollToSection("hero").
- Added dedicated CSS for the floating control:
  - fixed positioning near the bottom-right corner
  - hover styling aligned with the neon/cyan site theme
  - responsive offsets for small screens
- Kept i18n bindings on the floating button using existing keys:
  - footerBackToTop
  - footerBackToTopAria

## Resulting improvement
- The scroll-top control is now always available while users move up and down the page.
- UX is improved for long-page navigation because users can jump back to Hero from any section.
- The button placement avoids overlap with the existing admin floating control.
