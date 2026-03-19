# Changelog 2026-03-17 #24 - Accessibility та inline-style cleanup

## Як було
- У `index.html` і `admin.html` були попередження по accessibility (відсутні `title/placeholder`) та inline-styles.
- У модалі `admin.html` не було Safari-prefixed `-webkit-backdrop-filter`.

## Що було зроблено
- У `index.html`:
  - inline-style для wave delay замінено на CSS-класи,
  - inline text-shadow для заголовків замінено на класи,
  - додано `title/placeholder` для релевантних кнопок, лінків і полів форми.
- У `admin.html`:
  - додано `-webkit-backdrop-filter`,
  - додано `title/placeholder` для елементів, що сигналили у лінтері,
  - додано `title` для кнопки закриття модалки.

## Що це покращило, виправило, додало
- Зменшило кількість accessibility/стильових попереджень.
- Покращило сумісність з Safari/iOS.
- Зробило HTML більш чистим і підтримуваним (менше inline-style).
