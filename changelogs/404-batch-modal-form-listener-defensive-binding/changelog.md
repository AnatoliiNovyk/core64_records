# Batch 404: Modal Form Listener Defensive Binding

Реєстрація submit listener виконувалась прямим ланцюжком:

- `document.getElementById("modal-form").addEventListener(...)`

За відсутності елемента `modal-form` це могло завершитись runtime-помилкою і зірвати ініціалізацію скрипта.

Реєстрацію listener переведено на defensive-патерн:

- `const modalFormEl = document.getElementById("modal-form")`
- listener додається лише якщо елемент існує і `isConnected`.

Логіка submit handler збережена без поведінкових змін.

Усунуто критичний ризик падіння ініціалізації при зміні/відсутності DOM вузла форми.
Підвищено стійкість скрипта до часткових або динамічно змінених шаблонів.

Diagnostics check for `admin.js`: **No errors found**.
