# Batch 404: Modal Form Listener Defensive Binding

## Як було
- Реєстрація submit listener виконувалась прямим ланцюжком:
  - `document.getElementById("modal-form").addEventListener(...)`
- За відсутності елемента `modal-form` це могло завершитись runtime-помилкою і зірвати ініціалізацію скрипта.

## Що зроблено
- Реєстрацію listener переведено на defensive-патерн:
  - `const modalFormEl = document.getElementById("modal-form")`
  - listener додається лише якщо елемент існує і `isConnected`.
- Логіка submit handler збережена без поведінкових змін.

## Що покращило / виправило / додало
- Усунуто критичний ризик падіння ініціалізації при зміні/відсутності DOM вузла форми.
- Підвищено стійкість скрипта до часткових або динамічно змінених шаблонів.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
