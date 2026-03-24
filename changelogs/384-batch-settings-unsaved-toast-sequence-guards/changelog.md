# Batch 384: Settings Unsaved Toast Sequence Guards

`settings unsaved toast` використовував `requestAnimationFrame` та `setTimeout` без окремого sequence-token.
При швидких повторних показах/закриттях старі callback-и могли теоретично втручатися у новіший стан тосту.

## Що зроблено

## 1) Додано sequence state для тосту

Додано глобальну змінну:

- `let settingsUnsavedToastSequence = 0;`

## 2) Guard для progress animation RAF

У `animateSettingsUnsavedToastProgress` захоплюється `toastSequenceAtAnimation`.
У `requestAnimationFrame` додано перевірку:

- `if (toastSequenceAtAnimation !== settingsUnsavedToastSequence) return;`

## 3) Guard для auto-close timeout

У `scheduleSettingsUnsavedToastAutoClose`:

- захоплюється `toastSequenceAtSchedule`
- таймер прив’язано до `timeoutId`
- у callback перевіряється, що це саме актуальний таймер і актуальна sequence
- stale callback-и завершуються без побічних ефектів

## 4) Invalidate старих callback-ів при finalize

У `finalizeSettingsUnsavedToastDisplay` додано:

- `const toastSequenceAtFinalize = ++settingsUnsavedToastSequence;`

У restore-focus `requestAnimationFrame` додано sequence-перевірку.

## 5) Sequence на старті показу нового тосту

У `processSettingsUnsavedToastQueue` при активації нового тосту:

- `const toastSequenceAtShow = ++settingsUnsavedToastSequence;`

У RAF, що встановлює текст тосту, додано перевірки sequence і active state.

Прибрано race-класи для застарілих RAF/timeout callback-ів у settings toast lifecycle.
Поведінка тостів стала стабільнішою при швидкій черзі показу/закриття/перемикань стану.

Diagnostics check for `admin.js`: **No errors found**.
