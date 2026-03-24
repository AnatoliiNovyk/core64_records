# 437 Batch - OpenModal usable-id strict guard

- як було:
  - `openModal` перевіряв id через `isSupportedEntityIdValue`, що допускало визначені, але не придатні значення (наприклад, `NaN`, `Infinity`) при прямому виклику.

- що зроблено:
  - У `openModal` guard змінено на stricter-умову:
    - якщо id визначений і не є придатним (`hasUsableEntityId`), функція завершується.
  - Видалено зайвий helper `isSupportedEntityIdValue`, який більше не потрібен.

- що покращило/виправило/додало:
  - Вирівняно правила валідації id між `openModal`, `editItem`, `deleteItem` і submit-flow.
  - Усунуто edge-case входу в modal edit-flow з невалідним числовим id.
  - Зменшено зайвий код без зміни штатної поведінки.
