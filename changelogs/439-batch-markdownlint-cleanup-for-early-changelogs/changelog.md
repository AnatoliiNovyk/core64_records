# 439 Batch - Markdownlint cleanup for early changelogs

- як було:
  - У ранніх changelog-файлах були markdownlint-помилки форматування (зокрема `MD022` і `MD032`) через відсутні порожні рядки навколо заголовків/списків.

- що зроблено:
  - Виправлено форматування в:
    - `changelogs/412-batch-modal-missing-element-warn-once-guards/changelog.md`
    - `changelogs/413-batch-navigation-section-input-guards/changelog.md`
    - `changelogs/414-batch-modal-submit-target-guard/changelog.md`
  - Додано потрібні порожні рядки навколо заголовків і списків без зміни змісту.

- що покращило/виправило/додало:
  - Усунуто lint-шум у workspace diagnostics.
  - Підвищено чистоту документаційного треку hardening-батчів.
