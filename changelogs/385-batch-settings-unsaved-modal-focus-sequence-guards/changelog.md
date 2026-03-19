# Batch 385: Settings Unsaved Modal Focus Sequence Guards

## Як було
- Фокусування в settings-unsaved modal використовувало `requestAnimationFrame` без власного sequence-token.
- При швидкому відкритті/закритті модалки відкладені callback-и могли теоретично торкатися неактуального lifecycle.

## Що зроблено

### 1) Додано sequence state для modal lifecycle
- Додано глобальну змінну:
  - `let settingsUnsavedModalSequence = 0;`

### 2) Guard у `showSettingsUnsavedNavigationModal`
- На старті open-флоу:
  - `const modalSequenceAtShow = ++settingsUnsavedModalSequence;`
- У RAF-фокусі primary кнопки додано перевірку sequence:
  - `if (modalSequenceAtShow !== settingsUnsavedModalSequence) return;`

### 3) Guard у `resolveSettingsUnsavedNavigation`
- На старті resolve-флоу:
  - `const modalSequenceAtResolve = ++settingsUnsavedModalSequence;`
- У RAF-відновленні попереднього фокусу додано sequence-перевірку:
  - `if (modalSequenceAtResolve !== settingsUnsavedModalSequence) return;`

## Що покращило / виправило / додало
- Зменшено ризик stale focus side-effect у modal open/close циклах.
- Підвищено стабільність фокус-менеджменту при швидких взаємодіях з модалкою.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
