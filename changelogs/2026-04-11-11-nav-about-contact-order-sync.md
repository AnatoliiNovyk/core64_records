# 2026-04-11-11 Nav About Contact Order Sync

## Previous state
- Public page sections were rendered in the order where About appears before Contact.
- Navigation reorder logic inserted Contact before About in menu containers.
- Result: visible mismatch between menu order and actual section flow.

## What was changed
- Updated app.js in applyPublicSectionSettings() menu reorder block.
- Reordered insertion strategy:
  - first insert managed links except Contact before About anchor
  - then insert Contact explicitly after About
  - if About anchor is unavailable, insert links before non-link anchor block (mobile language switch wrapper) or append at end
- Kept existing visibility toggle logic for hidden sections unchanged.

## Resulting improvement
- Desktop and mobile navigation now match page section order consistently.
- About now appears before Contact in both menu containers.
- Section order UX is synchronized between nav and page content.
