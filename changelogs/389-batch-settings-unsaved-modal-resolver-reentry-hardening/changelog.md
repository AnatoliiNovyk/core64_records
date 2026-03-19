# Batch 389: Settings Unsaved Modal Resolver Re-entry Hardening

## Як було
- `showSettingsUnsavedNavigationModal` щоразу перезаписував `settingsUnsavedModalResolver` новим Promise-resolver.
- При повторному виклику до завершення попереднього діалогу попередній Promise міг залишатися невирішеним (dangling await-chain).

## Що зроблено
- Перед створенням нового Promise в `showSettingsUnsavedNavigationModal` додано захисний блок:
  - якщо `settingsUnsavedModalResolver` вже існує, він завершується як `cancel`;
  - після цього записується новий актуальний resolver.

## Що покращило / виправило / додало
- Прибрано ризик завислих Promise у re-entry сценаріях modal unsaved navigation.
- Покращено детермінованість поведінки при повторних/конкуруючих викликах модалки.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
