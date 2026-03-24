# Changelog 2026-03-17 #25 - CSS prefix order fix

У `admin.html` порядок `backdrop-filter` та `-webkit-backdrop-filter` не відповідав вимозі лінтера.

У стилях `.modal` переставлено декларації: спочатку `-webkit-backdrop-filter`, потім `backdrop-filter`.

Прибрало залишкове CSS-попередження про порядок префіксованої властивості.
Зробило кросбраузерну декларацію коректною з погляду style-правил.
