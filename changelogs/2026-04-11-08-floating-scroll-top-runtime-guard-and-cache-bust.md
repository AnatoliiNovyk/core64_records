# 2026-04-11-08 Floating Scroll Top Runtime Guard And Cache Bust

## Previous state
- The floating scroll-top button was present in index.html, but on some frontend sessions users still observed the old footer-like placement.
- The symptom indicated mixed client state (stale markup/CSS or partial cache), where the button could appear as a regular inline control.
- Existing implementation relied primarily on static HTML/CSS structure.

## What was changed
- Updated app.js with a runtime guard for the scroll-top control:
  - Added ensureFloatingScrollTopButton() to normalize the button at startup.
  - If a legacy footer variant is found, it is moved out of footer context and treated as a floating control.
  - If button is missing, it is created dynamically and wired to scrollToSection("hero").
  - Added applyFloatingScrollTopRuntimeStyles() to enforce fixed positioning and responsive offsets via JS.
  - Added resize handler to keep floating position stable across viewport changes.
- Updated index.html script include to force fresh JS fetch:
  - app.js -> app.js?v=2026-04-11-08.

## Resulting improvement
- The scroll-top button is now resilient to stale or mixed frontend state and is normalized to floating behavior at runtime.
- Users can access the button while scrolling up/down regardless of prior footer rendering artifacts.
- Cache-busting reduces the chance of clients running outdated JS after deployment updates.
