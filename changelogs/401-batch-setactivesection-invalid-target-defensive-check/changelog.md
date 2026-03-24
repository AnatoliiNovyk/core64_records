# Batch 401: `setActiveSection` Invalid Target Defensive Check

`setActiveSection` спочатку ховав усі `.section-content`, а потім шукав цільову секцію.
Якщо `section` був некоректним або DOM-елемент недоступний, функція завершувалась після приховування всіх секцій, залишаючи порожній екран.

Логіку змінено на defensive-послідовність:

- спочатку знайти і перевірити `sectionEl` (`exists + isConnected`),
- лише потім приховувати інші секції і показувати цільову.

Усунуто ризик blank UI при невалідному аргументі секції.
Підвищено стабільність навігаційного helper-а в edge-case сценаріях.

Diagnostics check for `admin.js`: **No errors found**.
