# 485 Batch - Changelog markdownlint hygiene

## What changed

- Normalized markdown spacing and structure across `changelogs/**/changelog.md` files to satisfy markdownlint rules consistently.
- Standardized heading/list blank-line handling and flattened unintended indented bullet entries.
- Fixed EOF newline handling so each changelog ends with a single trailing newline.
- Resolved one remaining `MD037` issue in `451-batch-modal-fields-template-sanitization/changelog.md` by escaping `item.*` and `fieldValues.*` as inline code.

## Why

- Keeps project diagnostics clean and reliable.
- Prevents doc-lint noise from obscuring runtime-focused regressions.
- Preserves changelog semantics while enforcing formatting consistency.

## Validation

- Diagnostics check across workspace: no errors found.
