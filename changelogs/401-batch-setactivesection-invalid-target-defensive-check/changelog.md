# Batch 401: `setActiveSection` Invalid Target Defensive Check

## Як було
- `setActiveSection` спочатку ховав усі `.section-content`, а потім шукав цільову секцію.
- Якщо `section` був некоректним або DOM-елемент недоступний, функція завершувалась після приховування всіх секцій, залишаючи порожній екран.

## Що зроблено
- Логіку змінено на defensive-послідовність:
  - спочатку знайти і перевірити `sectionEl` (`exists + isConnected`),
  - лише потім приховувати інші секції і показувати цільову.

## Що покращило / виправило / додало
- Усунуто ризик blank UI при невалідному аргументі секції.
- Підвищено стабільність навігаційного helper-а в edge-case сценаріях.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
