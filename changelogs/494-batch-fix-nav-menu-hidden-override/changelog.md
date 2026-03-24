# 494 Batch - Fix nav menu hidden override

## Як було

- У [index.html](index.html) було локальне CSS-правило `.hidden { display: none !important; }`.
- Воно перебивало responsive-класи Tailwind (`md:flex`) у навігації.
- Через це desktop-меню в хедері залишалось прихованим.

## Що зроблено

- Видалено локальне правило `.hidden` з [index.html](index.html).
- Залишено штатну поведінку класу `hidden` через Tailwind utility-класи.

## Що покращило

- Десктопна панель навігації знову відображається (пункти меню в хедері).
- Mobile/desktop логіка `hidden md:flex` працює коректно.
