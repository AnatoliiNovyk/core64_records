# 2026-04-19-220: Fix Firestore named database connection

## Як було
Додаток на Cloud Run підключався до Firestore database ID `(default)`, якої не існувало.
Користувач створив базу з іменем `core64recordsdb` (не `(default)`).
Всі колекційні endpoints (`/api/releases`, `/api/sponsors` тощо) повертали HTTP 500.

## Що зроблено
- `backend/src/config.js`: додано поле `firestoreDatabaseId` — читає `FIRESTORE_DATABASE_ID` env var, fallback `"(default)"`
- `backend/src/db/firestoreClient.js`: якщо `databaseId !== "(default)"` — передається в `getFirestore(app, databaseId)`, інакше стандартний виклик
- `.github/workflows/deploy-google-run.yml`: hardcoded `FIRESTORE_DATABASE_ID: core64recordsdb` в env блоці кроку "Deploy to Cloud Run" та в `--set-env-vars` рядку (нового input не потрібно — 25-input ліміт GitHub вже вичерпано)
- PR #10 `fix/firestore-named-database` — merged та deployed (run 24636859663 — success)

## Результат
- `GET https://core64.pp.ua/api/health` → `200 dataBackend=firestore` ✅
- `GET https://core64.pp.ua/api/releases` → `200 {"data":[],"language":"uk"}` ✅
- `GET https://core64.pp.ua/api/settings` → `401 AUTH_REQUIRED` (очікувано — публічний GET не дозволений) ✅
- Firestore підключається до `core64recordsdb` в `europe-west1`
