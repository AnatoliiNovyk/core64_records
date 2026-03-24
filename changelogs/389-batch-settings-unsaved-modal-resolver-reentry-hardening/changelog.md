# Batch 389: Settings Unsaved Modal Resolver Re-entry Hardening

`showSettingsUnsavedNavigationModal` щоразу перезаписував `settingsUnsavedModalResolver` новим Promise-resolver.
При повторному виклику до завершення попереднього діалогу попередній Promise міг залишатися невирішеним (dangling await-chain).

Перед створенням нового Promise в `showSettingsUnsavedNavigationModal` додано захисний блок:

- якщо `settingsUnsavedModalResolver` вже існує, він завершується як `cancel`;
- після цього записується новий актуальний resolver.

Прибрано ризик завислих Promise у re-entry сценаріях modal unsaved navigation.
Покращено детермінованість поведінки при повторних/конкуруючих викликах модалки.

Diagnostics check for `admin.js`: **No errors found**.
