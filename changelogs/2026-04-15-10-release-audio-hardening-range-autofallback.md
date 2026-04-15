# Release Audio Hardening: Range And Auto Fallback

## Як було

- `getReleaseTracks(...)` у адаптері не робив fallback на `meta`, якщо повний endpoint падав через timeout/мережеву помилку зі статусом `0`.
- Stream endpoint одного треку віддавав лише повний `200` без підтримки byte ranges, що погіршувало seek/перемотку в браузерному аудіо.
- Compact player стартував із треку `#1` без перевірки доступного аудіо-джерела і міг одразу зупинитися на `track unavailable`.

## Що зроблено

- У `data-adapter.js` розширено умови fallback у `getReleaseTracks(...)`:
  - fallback на `meta` тепер також спрацьовує для `status=0` і `API_NETWORK_TIMEOUT`,
  - збережено fallback для `413` і `5xx`.
- У backend stream endpoint `GET /api/release-tracks/:releaseId/:trackId/audio` додано hardening:
  - `ETag` + підтримка `If-None-Match` (`304`),
  - `Accept-Ranges: bytes`,
  - парсинг `Range` із поверненням `206 Partial Content`,
  - `416 Range Not Satisfiable` для невалідних діапазонів,
  - більш консервативний cache policy (`private, max-age=0, must-revalidate`).
- У compact player (`app.js`) додано пошук першого/наступного відтворюваного треку:
  - при відкритті релізу плеєр стартує з першого треку, для якого реально доступне джерело,
  - після завершення треку переходить до наступного відтворюваного, пропускаючи недоступні.

## Що покращило/виправило/додало

- Зменшено кількість сценаріїв, коли реліз-плеєр помилково показує порожній стан через timeout повного endpoint.
- Покращено UX аудіо-відтворення і сумісність із браузерними media controls завдяки `Range/206`.
- Підвищено стійкість автостарту/автопереходу compact player для релізів зі змішаною доступністю аудіо-джерел.
