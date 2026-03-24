# Batch 403: `showSection` Early Target Validation

`showSection(section)` виконував частину побічних cleanup дій (зокрема audit-exit cleanup) до перевірки, чи існує цільова секція в DOM.
Якщо `section` некоректний, функція могла зробити зайві побічні ефекти перед раннім виходом.

Додано ранню валідацію `targetSectionEl` одразу на старті `showSection`:

- `const targetSectionEl = document.getElementById(...)`
- ранній `return`, якщо елемент відсутній або disconnected.

Повторне пізніше оголошення `targetSectionEl` прибрано.

Унеможливлено зайві side-effect cleanup операції для невалідного `section` аргументу.
Підвищено defensive-стабільність навігаційного entry-point.

Diagnostics check for `admin.js`: **No errors found**.
