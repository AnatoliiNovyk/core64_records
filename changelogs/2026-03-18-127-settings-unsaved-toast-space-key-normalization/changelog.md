# 2026-03-18 #127 — Settings Unsaved Toast Space Key Normalization

## Було
- Обробка пробілу для закриття toast дублювалась у двох обробниках (`dismissSettingsUnsavedToast`, `handleSettingsUnsavedToastCloseButtonKeydown`).
- Підтримувались лише `event.key === " "` та `event.key === "Spacebar"`.

## Зміна
- Додано спільний хелпер `isSettingsUnsavedToastSpaceKey(event)` в `admin.js`.
- Обидва обробники переведено на використання хелпера.
- Додано додаткову сумісність: `event.key === "Space"` та `event.code === "Space"`.

## Стало краще
- Логіка визначення пробілу стала єдиною, простішою для подальшої підтримки.
- Підвищено кросбраузерну/крос-платформну надійність keyboard dismiss для toast.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено використання `isSettingsUnsavedToastSpaceKey` у двох обробниках і наявність `key/code`-гілок.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
