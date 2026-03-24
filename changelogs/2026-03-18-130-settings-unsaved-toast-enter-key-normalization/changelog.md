# 2026-03-18 #130 — Settings Unsaved Toast Enter Key Normalization

Keyboard-dismiss тоста використовував пряме порівняння `key === "Enter"` у кількох місцях.
Legacy-аліас `Return` не враховувався.

Додано спільний хелпер `isSettingsUnsavedToastEnterKey(event)` в `admin.js`.
`dismissSettingsUnsavedToast(event)` переведено на перевірку `isEnter`.
`handleSettingsUnsavedToastCloseButtonKeydown(event)` також переведено на `isEnter`.

Підвищено кросбраузерну/крос-платформну сумісність keyboard-dismiss для Enter/Return.
Логіка обробки Enter уніфікована в одному місці, легша підтримка.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `isSettingsUnsavedToastEnterKey` і гілку `key === "Return"`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
