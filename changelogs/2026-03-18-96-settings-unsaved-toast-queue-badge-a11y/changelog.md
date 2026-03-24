# Changelog - 2026-03-18 - Settings unsaved toast queue badge a11y

Бейдж `#settings-unsaved-toast-queue` показував тільки `+N`.
Для assistive technology і hover-підказки не було явного тексту з кількістю відкладених повідомлень.

Файл: `admin.js`

- Оновлено `updateSettingsUnsavedToastQueueBadge()`:
- коли черга пуста: очищається `title`, виставляється `aria-label="Відкладених повідомлень немає"`;
- коли є відкладені повідомлення: додаються
- `title="Відкладених повідомлень: N"`
- `aria-label="Відкладених повідомлень: N"`.

Краща зрозумілість бейджа при наведенні (tooltip через `title`).
Краща доступність для screen reader, оскільки `+N` доповнено семантичним текстом.
Без змін у логіці черги/таймерів: лише UX+a11y-поліпшення.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
