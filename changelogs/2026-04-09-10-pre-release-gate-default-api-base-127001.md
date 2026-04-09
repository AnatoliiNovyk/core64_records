# 2026-04-09-10 Pre Release Gate Default Api Base 127001

## Як було

- Локальний pre-release gate за замовчуванням використовував `http://localhost:3000/api`.
- У частині оточень `localhost` давав нестабільний network-resolve шлях для Node fetch, що проявлялось як `fetch failed` на smoke.
- Для стабільного прогону доводилось вручну перевизначати `CORE64_API_BASE` на `127.0.0.1`.

## Що зроблено

- У [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1) змінено дефолт параметра `Core64ApiBase`:
  - було: `http://localhost:3000/api`
  - стало: `http://127.0.0.1:3000/api`
- Існуючий fallback/retry-механізм у кроці smoke залишено без змін як додатковий safeguard.

## Що покращило/виправило/додало

- Зменшено ймовірність флакiв локального gate без додаткових ручних параметрів.
- Сценарій локального запуску став більш передбачуваним «з коробки».
- Поведінка для кастомного `-Core64ApiBase` повністю збережена.
