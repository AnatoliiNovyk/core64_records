# Batch 397: Logout Concurrency Guard

`logout()` міг стартувати повторно при кількох швидких кліках/тригерах до завершення першого запиту.
Це створювало ризик конкурентних `adapter.logout()` викликів і дубльованих side-effect.

Додано глобальний прапорець:

- `let logoutInProgress = false;`

У `logout()`:

- на вході: `if (logoutInProgress) return;`
- перед `await adapter.logout()`: `logoutInProgress = true;`
- у `finally`: `logoutInProgress = false;`

Виключено паралельні logout запити.
Підвищено стабільність logout flow при повторних швидких взаємодіях.

Diagnostics check for `admin.js`: **No errors found**.
