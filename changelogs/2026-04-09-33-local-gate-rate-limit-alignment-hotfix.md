# 2026-04-09-33 Local Gate Rate-Limit Alignment Hotfix

## Як було

- Локальний pre-release gate у smoke кроці примусово передавав `SmokeRateLimitCheck=false`.
- Це вимикало rate-limit перевірку навіть коли параметр запуску gate був увімкнений.
- Локальний прогін міг давати хибно-зелений результат у сценаріях, де CI перевіряв 429-path.

## Що зроблено

- У `scripts/pre-release-gate-local.ps1` виправлено 2 виклики `Invoke-SmokeCheck`:
  - основний smoke запуск;
  - fallback retry після `localhost -> 127.0.0.1`.
- Замість hardcoded `-SmokeRateLimitCheck $false` тепер використовується `-SmokeRateLimitCheck $Core64SmokeRateLimitCheck`.

## Що покращило/виправило/додало

- Вирівняно поведінку local gate з фактичним параметром запуску rate-limit smoke.
- Зменшено drift між local і CI pre-release перевірками.
- Знижено ризик пропуску регресій 429-контракту в локальному передрелізному контурі.
