# 455 Batch - Audit/auth/bootstrap adapter preflight

- як було:
  - Частина критичних flows (bootstrap/auth/audit/reset) ще містила прямі adapter-виклики без уніфікованого preflight.
  - При неповному adapter-контракті можливі runtime-помилки або некеровані збої UI.

- що зроблено:
  - loadAuditLatencyThresholdsFromSettings:
    - додано preflight на getCollection;
    - завантаження settings переведено на method.call(adapter, ...);
    - при відсутності методу застосовується безпечний fallback порогів.
  - DOMContentLoaded bootstrap:
    - ensureLocalDefaults переведено на guarded-виклик;
    - isApiAvailable переведено на guarded-виклик;
    - при відсутності isApiAvailable показується контрольований API status message.
  - Auth flow:
    - checkAuth: preflight для isAuthenticated;
    - handleLogin: preflight для login;
    - logout: preflight для logout.
  - Audit flow:
    - loadAuditLogs: preflight для getAuditLogs/getAuditFacets з контрольованим showAuditError;
    - exportAuditCsv: preflight для getAuditLogs.
  - resetData:
    - ensureLocalDefaults синхронізовано з getAdapterMethod і викликається через method.call(adapter).

- що покращило/виправило/додало:
  - Суттєво знижено ризик runtime-падінь у ключових секціях адмінки при частковій недоступності adapter.
  - Деградація стала керованою: warn/error + зрозумілі user-facing повідомлення.
  - Для валідного adapter поведінка залишилась сумісною.
