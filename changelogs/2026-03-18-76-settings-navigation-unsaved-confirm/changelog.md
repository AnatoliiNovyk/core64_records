# Changelog - 2026-03-18 - Settings navigation unsaved confirm

Додано підтвердження при переході з секції `settings` в іншу секцію, якщо пороги latency мають незбережені зміни.
Якщо користувач скасовує підтвердження, перехід не виконується і залишається поточна секція налаштувань.

Файл: `admin.js`

- Оновлено `showSection(section)`:
- перед перемиканням секції перевіряє умови:
- `currentSection === "settings"`
- `section !== "settings"`
- `hasUnsavedAuditLatencyThresholdChanges === true`
- показує `confirm("Є незбережені зміни порогів latency. Перейти без збереження?")`
- при відмові робить `return` без перемикання секції.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

UX став безпечнішим: ризик випадково втратити незбережені зміни порогів під час навігації по адмінці знижено.
