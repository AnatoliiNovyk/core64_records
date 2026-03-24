# Step 343 — loadAuditLatencyThresholdsFromSettings post-await context guard

\dmin.js\

\loadAuditLatencyThresholdsFromSettings\

Captured \sectionAtLoad = currentSection\ before awaiting settings load.
Added \currentSection !== sectionAtLoad\ early return before applying loaded thresholds.
Added the same guard in the \catch\ path before applying fallback thresholds.

Prevents stale bootstrap or section-transition async completions from applying audit latency UI side-effects after the user has switched context.

None — additive guard only; active-section behavior is preserved.

No errors.
