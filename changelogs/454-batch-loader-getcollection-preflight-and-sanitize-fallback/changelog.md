# 454 Batch - Loader getCollection preflight and sanitize fallback

- як було:
  - sanitizeInput повністю залежав від adapter.sanitizeText без fallback.
  - refreshCache/loadReleases/loadArtists/loadEvents/loadSettings викликали adapter.getCollection напряму.
  - При неповному adapter-контракті можливі runtime-помилки в секційних loader-ах.

- що зроблено:
  - Посилено sanitizeInput:
    - preflight через getAdapterMethod("sanitizeText");
    - якщо метод доступний, виклик через method.call(adapter, text);
    - якщо недоступний, застосовується локальний HTML-escape fallback (&, <, >, ", ').
  - Посилено refreshCache:
    - preflight на getCollection;
    - всі завантаження (releases/artists/events/settings) переведені на method.call(adapter, collectionName).
  - Посилено loadReleases/loadArtists/loadEvents/loadSettings:
    - preflight на getCollection;
    - контрольований early-return з warn + user alert (в межах відповідної активної секції);
    - виклики колекцій переведені на method.call(adapter, ...).

- що покращило/виправило/додало:
  - Підвищено стійкість data-loading контуру до часткової недоступності adapter API.
  - Додано безпечну деградацію sanitizeInput без падіння UI.
  - Поведінка для валідного adapter залишилась штатною.
