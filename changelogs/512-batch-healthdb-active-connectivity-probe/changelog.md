# 512 Batch - health/db active connectivity probe

## Як було

- Після додавання timeout correlation (`durationMs` vs `connectionTimeoutMs`) у smoke лишався ручний етап: відрізняти DNS-рівень від TCP reachability-рівня.
- У `health/db` не було active probe з runtime-контексту, який би показував, чи резолвиться DB host і чи досяжний TCP порт.

## Що зроблено

- Оновлено [backend/src/routes/health.js](backend/src/routes/health.js):
  - додано safe `runConnectivityProbe(...)`, який при network-like помилках (`timeout`, `network`, `connection`, `dns`) виконує:
    - DNS probe (`dns.lookup` all records)
    - TCP probe (`net.Socket` connect з керованим timeout)
  - probe результат (`details.probe`) додається в `/health/db` degraded payload без витоку credentials.
- Оновлено [scripts/smoke-check.mjs](scripts/smoke-check.mjs):
  - `checks.healthDb` тепер включає `probe`;
  - timeout hint використовує probe-дані для точнішого root-cause повідомлення:
    - DNS fail -> DNS/egress hint
    - DNS ok + TCP fail -> egress/NAT/firewall/allowlist hint.
- Оновлено [README.md](README.md) у секції deploy diagnostics з описом нового `probe` блоку.

## Що покращило

- Зменшено час до root-cause при persistent timeout: CI smoke одразу показує рівень збою (DNS vs TCP reachability).
- Покращена операційна діагностика без послаблення policy-gate і без витоку секретних даних.
