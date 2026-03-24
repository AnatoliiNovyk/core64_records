# 498 Batch - Hero YouTube icon rendered via inline SVG

## Як було

- У Hero-блоці YouTube-іконка рендерилась через `lucide` (`<i data-lucide="youtube">`), але у фронтенд-середовищі вона не відмальовувалась стабільно.

## Що зроблено

- Замінено YouTube-іконку в Hero на inline SVG у [index.html](index.html).
- Залишено існуючі атрибути доступності (`title`, `aria-label`) та поведінку посилання без змін.

## Що це виправило

- Іконка YouTube гарантовано відображається на фронтенді незалежно від завантаження/резолву Lucide-іконок.
