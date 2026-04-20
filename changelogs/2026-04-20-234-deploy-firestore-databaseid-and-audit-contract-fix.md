# 2026-04-20-234 — Deploy Firestore DatabaseId And Audit Contract Fix

## Як було

- Локальний pre-release gate падав на кроці API contract через `GET /settings -> 500 INTERNAL_SERVER_ERROR`.
- У backend логах фіксувався Firestore gRPC `5 NOT_FOUND`, що вказувало на невірний `FIRESTORE_DATABASE_ID`.
- Дефолти в env/docs/workflow були розсинхронізовані з реальною named Firestore базою (`core64recordsdb`).
- Після стискання audit details контрактний крок settings/public міг трактувати `details.diff.settings` як malformed, бо в list-відповіді губилася структура `changes`.

## Що зроблено

- Оновлено Firestore database id на named database `core64recordsdb`:
- `backend/.env`
- `backend/.env.example`
- `.github/workflows/deploy-google-run.yml` (default input `firestore_database_id`)
- Документацію синхронізовано з фактичним runtime значенням:
- `README.md`
- `GOOGLE_RUN_DEPLOYMENT.md`
- Посилено pre-deploy env-check: у `scripts/check-google-run-env.ps1` додано обов'язкову перевірку `FIRESTORE_DATABASE_ID`.
- У `backend/src/db/repository.firestore.js` доопрацьовано `compactAuditDetailsForList(...)`:
- збережено структурований `details.diff.settings.changes` для контрактних перевірок;
- великі/inline значення лишились компактними (safe truncation/data-url marker), щоб не повертати важкі payload.
- У `backend/src/config.js` зафіксовано детерміноване завантаження `backend/.env` незалежно від поточного `cwd`.

## Що покращило/виправило/додало

- Усунуто ключовий deploy/runtime блокер `GET /settings -> 500` через Firestore `NOT_FOUND` на невірній database id.
- Відновлено проходження API error contract перевірки.
- Відновлено коректну форму audit diff у list-контракті без повернення надмірних даних.
- Зменшено ризик повторної регресії через розсинхронізацію env/workflow/docs.
