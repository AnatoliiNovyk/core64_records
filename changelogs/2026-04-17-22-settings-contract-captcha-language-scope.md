# 2026-04-17-22 Settings Contract Captcha Language Scope

## Як було

- `scripts/settings-public-contract-check.mjs` очікував, що captcha-повідомлення після `PUT /settings` однаково оновляться і для `public?lang=uk`, і для `public?lang=en`.
- У поточній i18n-моделі бекенду ці поля оновлюються language-scoped (активна мова), а інша локаль зберігає попередні переклади.
- Через це контрактний крок падав false-negative з помилкою про невідповідність expanded contract fields.

## Що зроблено

- У `scripts/settings-public-contract-check.mjs` уточнено перевірки для captcha-меседжів:
- Перед save читається `GET /settings?lang=en` як baseline для англомовних значень.
- Для `publicUk` captcha-поля звіряються з новими expected значеннями.
- Для `publicEn` captcha-поля звіряються з попередніми `en`-значеннями (baseline), якщо для них не було явного окремого оновлення.

## Що покращило/виправило/додало

- Контрактна перевірка узгоджена з реальною language-scoped поведінкою settings i18n.
- Усунено хибне падіння pre-release gate при коректному збереженні даних.
- Підвищено точність сигналу контрактного тесту: падіння тепер означає реальну регресію, а не неузгоджені очікування.
