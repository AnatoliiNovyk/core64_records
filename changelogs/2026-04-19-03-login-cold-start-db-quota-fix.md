# Fix: Admin Login Cold Start Timeout + DB Quota Dashboard Error

## Previous State

- `API_READINESS_PROBE_TIMEOUT_MS = 1200ms` — при cold start Cloud Run `/health` відповідала повільніше за 1.2 сек.
  `shouldUseApi()` кешував `false` → `adapter.login()` переходив в offline режим → кидав "Invalid credentials" (401) → на екрані логіну показувалось "Невірний пароль!" хоч пароль вірний.
- У `handleLogin()`: якщо `loadDashboard()` кидав помилку (наприклад, Neon DB quota exceeded → HTTP 507) ПІСЛЯ того як login вже пройшов і login screen було приховано — catch блок встановлював errorEl.textContent, але відображав його у **прихованому** login screen, і жодного видимого повідомлення на dashboard не показував.

## What Was Changed

### `data-adapter.js`
- `API_READINESS_PROBE_TIMEOUT_MS` збільшено з `1200` до `5000` мс.
  Дозволяє health probe пройти навіть при cold start Cloud Run (де перший відповідь може займати 2–4 сек).

### `admin.js` — `handleLogin()`
- Додано прапорець `loginSucceeded = false`, який встановлюється в `true` після успішного `adapter.login()`.
- У catch блоці: якщо `loginSucceeded === true` (тобто помилка сталась під час `loadDashboard()`, а не під час логіну) → викликається `showApiStatus(tAdmin("loadDataApiError"))` на dashboard замість показу помилки в прихованому login screen.
- Видалено дублювання `console.error("Login failed", error)` (тепер один виклик в кінці).

## Resulting Improvement

- Cold start Cloud Run більше не призводить до помилкового "Невірний пароль!" через timeout health probe.
- Якщо login пройшов але `loadDashboard()` впав (наприклад, Neon DB quota exceeded) — користувач бачить видиме повідомлення про помилку на dashboard, а не порожній екран без пояснень.
