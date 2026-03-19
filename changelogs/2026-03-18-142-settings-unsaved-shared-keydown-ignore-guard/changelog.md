# 2026-03-18 #142 — Settings Unsaved Shared Keydown Ignore Guard

## Було
- Ранні виходи для `keydown` (`defaultPrevented`, `isComposing`, модифікатори) дублювались у `dismissSettingsUnsavedToast(event)` і `handleSettingsUnsavedModalKeyboard(event)`.

## Зміна
- Додано спільний хелпер `shouldIgnoreSettingsUnsavedKeydownEvent(event)` у `admin.js`.
- Обидва обробники переведено на використання цього хелпера.

## Стало краще
- Прибрано дублювання базової keyboard-guard логіки.
- Поведінка залишилась незмінною, але підтримка й подальші правки стали простішими й безпечнішими.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено використання `shouldIgnoreSettingsUnsavedKeydownEvent(event)` у toast і modal keyboard-обробниках.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
