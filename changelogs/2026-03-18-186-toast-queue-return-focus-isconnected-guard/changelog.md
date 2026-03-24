# Changelog #186: Guard toast queue return-focus capture by isConnected

У `processSettingsUnsavedToastQueue()` active елемент зберігався як return-focus таргет, якщо не був усередині toast і мав `focus()`.
Теоретично в edge-сценаріях active елемент міг бути вже відʼєднаний у момент збереження.

Додано `isConnected` guard при захопленні `document.activeElement`:

- `if (activeEl && activeEl.isConnected && !toastEl.contains(activeEl) && typeof activeEl.focus === "function")`

Логіку черги toast і UX не змінено.

Менше ризику зберегти невалідну ціль для подальшого focus-restore.
Стабільніший return-focus flow у рідкісних race/DOM churn випадках.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `processSettingsUnsavedToastQueue()` присутній `activeEl.isConnected` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
