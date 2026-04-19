## Як було
- При збереженні налаштувань у адмінці користувач бачив загальне повідомлення `Failed to save settings` без конкретної причини від API.
- Через це було складно зрозуміти, що саме не проходить валідацію (наприклад, поля секцій, домен captcha, пороги latency тощо).

## Що зроблено
- У `admin.js` додано локалізований ключ повідомлення з деталями:
  - `settingsSaveFailedDetails` (uk/en).
- У `admin.js` додано `resolveSettingsSaveErrorMessage(error)` для цільового мапінгу помилок Settings save:
  - unauthorized -> `saveRecordSessionExpired`;
  - payload too large -> `settingsSaveTooLarge`;
  - rate limited (429 / *_RATE_LIMITED) -> `saveRecordRateLimited`;
  - DB unavailable -> `databaseTemporarilyUnavailable`;
  - якщо є текст помилки від API -> `settingsSaveFailedDetails`.
- У `saveSettings(...)` catch-блоці загальний fallback замінено на виклик `resolveSettingsSaveErrorMessage(error)`.

## Що покращило / виправило / додало
- Тепер під час помилки збереження налаштувань користувач бачить конкретну причину, а не лише загальну фразу.
- Це дозволяє швидко виправити реальне поле/обмеження та зменшує час діагностики інцидентів у Settings.
