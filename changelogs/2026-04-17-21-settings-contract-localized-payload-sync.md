# 2026-04-17-21 Settings Contract Localized Payload Sync

## Як було

- `scripts/settings-public-contract-check.mjs` для `PUT /settings` оновлював лише `title/about/mission`.
- У payload залишалися попередні значення `titleUk/titleEn`, `aboutUk/aboutEn`, `missionUk/missionEn`.
- Через пріоритет локалізованих полів у бекенд-i18n читанні зміни могли не відображатися в `GET /settings`, а audit diff не формувався як очікує контракт.

## Що зроблено

- У `scripts/settings-public-contract-check.mjs` синхронізовано формування `updatedSettings`:
- Разом із `title/about/mission` тепер оновлюються `titleUk/titleEn`, `aboutUk/aboutEn`, `missionUk/missionEn` тими самими контрактними значеннями.

## Що покращило/виправило/додало

- Контрактна перевірка `settings/public` формує консистентний payload для i18n-схеми.
- Усунено false-negative падіння на перевірці `Settings audit diff entry is missing or malformed after PUT /settings`.
- Gate перевіряє реальну цілісність settings/audit, а не артефакт несинхронного payload.
