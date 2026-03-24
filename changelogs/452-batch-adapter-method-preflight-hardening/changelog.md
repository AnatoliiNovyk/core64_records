# 452 Batch - Adapter method preflight hardening

- як було:
  - У modal submit/delete/saveSettings виклики adapter.* методів робились без централізованої перевірки доступності функцій.
  - Якщо adapter або конкретний метод відсутній/пошкоджений, можливі runtime-помилки.

- що зроблено:
  - Додано helper getAdapterMethod(methodName):
    - перевіряє валідність adapter як object;
    - перевіряє валідність назви методу;
    - повертає тільки function або null.
  - Посилено modal submit flow:
    - preflight для updateItem/createItem залежно від режиму edit/create;
    - безпечний early-return з warn + user alert, якщо метод недоступний;
    - виклик через method.call(adapter, ...).
  - Посилено deleteItem:
    - preflight для deleteItem;
    - ранній guard з warn + user alert;
    - виклик через method.call(adapter, ...).
  - Посилено saveSettings:
    - preflight для saveCollection;
    - ранній guard з warn + user alert;
    - виклик через method.call(adapter, ...).

- що покращило/виправило/додало:
  - Знижено ризик падінь при частково недоступному adapter-контракті.
  - Помилки недоступності методу стали контрольованими і зрозумілими для користувача.
  - Для валідного adapter-провайдера поведінка не змінена.
