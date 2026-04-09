# 2026-04-09-26 UI Smoke Preflight and Changelog Format Gate

## Як було

- `scripts/ui-smoke.mjs` падав з `fetch failed` у середовищах, де `localhost` резолвився нестабільно, без автоматичного fallback на `127.0.0.1`.
- Pre-release gate перевіряв changelog coverage, але не валідував формат changelog-файлів на обов'язкову 3-секційну структуру.
- Через це можна було пройти gate з changelog, який формально існує, але не відповідає процесному шаблону.

## Що зроблено

- У `scripts/ui-smoke.mjs` додано API preflight із резолюцією робочої бази:
  - preflight перевіряє `GET /health` для `CORE64_API_BASE`;
  - якщо `fetch failed` і host = `localhost`, виконується fallback retry на `127.0.0.1`;
  - обраний `apiBase` використовується далі для API-запитів і proxy-forward у статичному smoke-сервері.
- Додано новий verifier `scripts/verify-changelog-format.mjs`:
  - приймає `--base`/`--head`;
  - перевіряє змінені markdown-файли в `changelogs/**`;
  - вимагає наявність 3 секцій: попередній стан, що змінено, результат покращення/виправлення.
- Інтегровано format-check у gate:
  - локально: `scripts/pre-release-gate-local.ps1` (новий fail-fast крок + оновлена нумерація кроків);
  - CI: `.github/workflows/pre-release-gate.yml` (новий крок `Validate changelog format`).
- Оновлено `RELEASE_RUNBOOK.md` для фіксації обов'язкової changelog format перевірки.

## Що покращило/виправило/додало

- UI smoke став стійкішим до середовищних `localhost`-мережевих флуктуацій без послаблення перевірок.
- Release gate тепер контролює не тільки наявність changelog, а й його процесну якість/структуру.
- Зменшено ризик проходження релізу з неповними або нечітко структурованими changelog-артефактами.
