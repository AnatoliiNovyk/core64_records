# 2026-04-21-252 Rate Limiter Cleanup and Contact Message Cap

## Як було

- In-memory rate limiter cleanup запускався лише після великого порогу та міг залишати велику кількість застарілих ключів, що створювало ризик росту памʼяті під високою кардинальністю IP/route.
- Поле `contact.message` не мало верхньої межі довжини, тому надмірний текстовий payload відсікався пізно (на transport/storage межах), а не на стадії валідації.

## Що зроблено

- У `backend/src/middleware/security.js` оновлено cleanup-алгоритм rate limiter:
  - додано періодичний cleanup за лічильником запитів;
  - додано cleanup за порогом розміру map;
  - додано ліміт кількості видалень за один прогін;
  - додано hard-cap map (`maxEntries`) з контрольованим overflow-eviction;
  - для активних ключів оновлюється insertion-order, щоб overflow eviction видаляв менш актуальні ключі.
- У `backend/src/middleware/validate.js` додано `CONTACT_REQUEST_MESSAGE_MAX_CHARS = 8000` і застосовано до `contactRequestSchema.message` через `trim().min(1).max(...)`.

## Що покращило/виправило/додало

- Знижено ризик неконтрольованого росту памʼяті в middleware rate limiting при довготривалому навантаженні.
- Підвищено передбачуваність валідації contact payload: наддовгі повідомлення тепер відхиляються ранньо і консистентно на schema-рівні.
- Зменшено ймовірність пізніх storage/transport помилок для контактних запитів із неадекватно великим `message`.
