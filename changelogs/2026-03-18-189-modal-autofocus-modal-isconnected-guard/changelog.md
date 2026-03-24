# Changelog #189: Guard modal autofocus by modal isConnected

У autofocus callback для unsaved modal primary button вже були open-state, containment, button connectivity і focus-function guard.
Однак сам `modalEl` не перевірявся на `isConnected` безпосередньо у callback.

На початку RAF callback додано:

- `if (!modalEl.isConnected) return;`

Інша логіка autofocus не змінена.

Менше ризику виконання focus-flow над stale modal вузлом при міжкадровому DOM churn.
Додатковий reliability guard без зміни UX-поведінки.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- в autofocus callback присутній `modalEl.isConnected` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
