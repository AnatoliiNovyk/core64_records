# 2026-04-11-05 Settings I18n Consistency Language-Paired Checker

## Previous state
- The settings i18n consistency checker compared both public locales against a single source: GET /settings.
- That behavior did not match the current language-scoped model where settings are resolved per locale.
- The self-test did not include an explicit cross-language bleed scenario.

## What was changed
- Updated scripts/check-settings-i18n-consistency.mjs:
  - Reads expected values from GET /settings?lang=uk and GET /settings?lang=en separately.
  - Compares in locale pairs: adminUk -> publicUk and adminEn -> publicEn.
  - Keeps hero subtitle checks locale-bound: heroSubtitleUk -> publicUk.heroSubtitle and heroSubtitleEn -> publicEn.heroSubtitle.
- Updated scripts/test-check-settings-i18n-consistency.mjs:
  - Mock API now returns distinct settings payloads for lang=uk and lang=en.
  - Replaced mirrored mismatch case with cross-language-title-bleed negative test.
- Validation run: node scripts/test-check-settings-i18n-consistency.mjs (PASS).

## Resulting improvement
- The regression checker now reflects the real language-scoped architecture.
- The helper test catches locale cross-bleed earlier in local verification.
- Release gate confidence for settings i18n consistency is improved.
