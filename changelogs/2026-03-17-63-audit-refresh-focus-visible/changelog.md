# Changelog - 2026-03-17 - Audit refresh focus-visible styling

Додано явний `focus-visible` стиль для кнопок ручного оновлення аудиту.
Покращено keyboard-навігацію для `Оновити зараз` і `Форс-оновлення`.

Файл: `admin.html`
Для `#audit-refresh-now-btn` додано Tailwind-класи:

- `focus-visible:outline-none`
- `focus-visible:ring-2`
- `focus-visible:ring-cyan-300`
- `focus-visible:ring-offset-2`
- `focus-visible:ring-offset-[#0a0a0f]`

Для `#audit-force-refresh-btn` додано Tailwind-класи:

- `focus-visible:outline-none`
- `focus-visible:ring-2`
- `focus-visible:ring-emerald-300`
- `focus-visible:ring-offset-2`
- `focus-visible:ring-offset-[#0a0a0f]`

Статична перевірка:

- `admin.html`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Кнопки ручного оновлення мають чіткий фокус-індикатор при навігації з клавіатури, що покращує доступність і UX.
