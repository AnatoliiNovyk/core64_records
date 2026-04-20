## Як було
- У проді в адмінці при редагуванні релізу з великим inline `data:image/...` збереження падало з загальним `Internal server error`.
- Frontend для CRUD-картинок фактично допускав upload до 2MB, тоді як Firestore-документи мають жорсткі обмеження на розмір payload.
- Через це oversized base64-зображення проходило клієнтську перевірку і провокувало помилку з боку backend/storage.

## Що зроблено
- У `backend/src/middleware/validate.js` додано явний guard для image/logo полів CRUD-колекцій (`releases`, `artists`, `events`, `sponsors`):
  - для inline `data:image/...` введено ліміт довжини payload;
  - для URL/шляхових значень введено окремий безпечний ліміт рядка;
  - при перевищенні повертається валідаційна помилка з поясненням про завеликий inline image.
- У `admin.js` розділено image-ліміти:
  - для settings-лого залишено 2MB;
  - для CRUD-зображень (release/artist/event/sponsor) встановлено 500KB;
  - додано окремі i18n-повідомлення `uploadTooLargeCollection` (UK/EN), щоб користувач бачив точне обмеження ще до API-запиту.
- Вирівняно поведінку UI з підказками в модалках CRUD (500KB), щоб уникати false expectation і повторного сценарію 500.

## Що покращило/виправило/додало
- Усунено клас падінь save-релізу з `Internal server error` через oversized inline image.
- Помилка тепер перехоплюється раніше і повертається як контрольований validation-case замість серверного крашу.
- Зменшено ризик повторного інциденту для всіх CRUD-сутностей, що мають image/logo поля.
