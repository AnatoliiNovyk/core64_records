# 464 Batch - Search and date key normalization

- як було:
  - Пошуковий текст у contacts/audit нормалізувався в різних місцях по-різному.
  - Date-key для contacts фільтра не обробляв стабільно рядки формату `YYYY-MM-DDTHH:mm:ss...` без локального зсуву.

- що зроблено:
  - Додано helper-и:
    - `extractIsoDatePrefix(value)` — безпечно дістає `YYYY-MM-DD` з datetime-рядка.
    - `normalizeSearchText(value)` — уніфікує String/trim/lowercase (+ NFKC, якщо доступно).
  - `getDateFilterKey` посилено:
    - тепер спочатку пробує strict ISO,
    - потім безпечний prefix extraction,
    - далі fallback через Date-парсинг.
  - `loadAuditLogs`:
    - query переведено на `normalizeSearchText(...)`.
  - `exportAuditCsv`:
    - query також переведено на `normalizeSearchText(...)`.
  - `getFilteredContacts`:
    - query переведено на `normalizeSearchText(...)`;
    - haystack поля (subject/email/name) також нормалізуються через shared helper.

- що покращило/виправило/додало:
  - Пошук став консистентнішим у contacts/audit flow.
  - Date-filter у contacts став стабільнішим для ISO datetime рядків з часовою частиною.
  - Зменшено дублювання логіки текстової нормалізації.
