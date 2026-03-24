# Changelog - 2026-03-17 - Audit latency thresholds reset button

Додано кнопку швидкого скидання порогів latency до дефолтних значень (300/800) у секції налаштувань.
Додано клієнтську функцію, яка:

- повертає значення в input-поля;
- одразу оновлює легенду/tooltip/кольорову індикацію в аудиторному UI;
- додає запис в «Остання активність».

Файл: `admin.html`

- У блоці «Пороги latency для аудиту» додано кнопку:
- `onclick="resetAuditLatencyThresholdsForm()"`

Файл: `admin.js`

- Додано `resetAuditLatencyThresholdsForm()`:
- встановлює `setting-audit-latency-good-max = 300`
- встановлює `setting-audit-latency-warn-max = 800`
- викликає `applyAuditLatencyThresholds(...)` для миттєвого прев’ю
- пише activity-лог: «Скинуто пороги latency до дефолтних (без збереження)»

Статичні перевірки:

- `admin.html`: без помилок
- `admin.js`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Адміністратор може швидко повернути дефолтні пороги latency без ручного вводу.
Прев’ю порогів застосовується одразу; фінальна фіксація як і раніше робиться через кнопку «Зберегти».
