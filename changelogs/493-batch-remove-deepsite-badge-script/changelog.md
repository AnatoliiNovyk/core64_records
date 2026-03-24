# 493 Batch - Remove DeepSite badge script

## Як було

- На публічній сторінці підключався зовнішній скрипт бейджа DeepSite.
- Скрипт інжектив у DOM плаваючий елемент "Made with DeepSite".

## Що зроблено

- Видалено підключення скрипта `https://deepsite.hf.co/deepsite-badge.js` з [index.html](index.html#L405).

## Що покращило

- Прибрано сторонній бейдж з інтерфейсу.
- Сторінка більше не тягне зовнішній інжект-скрипт DeepSite.
