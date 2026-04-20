# 2026-04-20-227 — Events Save DB Storage Limit Message Fix

## Як було

- Під час збереження EVENT на проді API повертав `DB_STORAGE_LIMIT_REACHED`, але адмінка показувала текст про `API unreachable + browser storage is full`.
- Через це причина помилки виглядала неправильною, ніби проблема у localStorage браузера.

## Що зроблено

- В `admin.js` розділено помилки сховища на дві категорії:
  - `LOCAL_STORAGE_QUOTA_EXCEEDED` -> старе повідомлення про переповнений browser storage.
  - `DB_STORAGE_LIMIT_REACHED` -> нове окреме повідомлення про ліміт сховища бази даних.
- Оновлено мапінг `resolveCrudSaveErrorMessage(...)`, щоб `DB_STORAGE_LIMIT_REACHED` більше не підпадав під local quota текст.
- Оновлено cache-bust версії в `admin.html` до `2026-04-20-227`.

## Що покращило / виправило / додало

- Адмінка показує коректну причину помилки збереження EVENT.
- Знято оманливий текст про browser storage для серверного DB quota інциденту.
- Діагностика прод-проблем стала однозначною і операційно коректною.
