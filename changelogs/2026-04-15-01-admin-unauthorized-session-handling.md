# Admin Unauthorized Session Handling

## Previous state

- When admin API requests returned 401 (expired/invalid session), the UI could show a generic backend connectivity error.
- In audit and section loading flows, unauthorized errors were not handled explicitly as auth/session problems.
- This made the issue look like backend outage even when API health was actually OK.

## What was changed

- Added explicit unauthorized error detection in admin runtime.
- Added centralized unauthorized session handler that clears auth session via adapter logout and reloads to login flow.
- Applied this handling in section loading error path and audit loading error path.
- Added dedicated localized message key for expired session in both UK and EN dictionaries.

## Resulting improvement

- Expired/invalid admin sessions no longer masquerade as backend connection failures.
- Admin panel now returns user to re-authentication flow predictably on 401.
- Diagnostic clarity is improved: auth/session errors are handled as auth issues, not network issues.
