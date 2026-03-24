# 442 Batch - Submit defined invalid id stop guard

- як було:
  - У submit-обробнику модалки `editingId` нормалізувався і далі режим визначався через `hasUsableEntityId`.
  - Якщо `editingId` був заданий, але невалідний, потік міг перейти в create-гілку через fallback.

- що зроблено:
  - Додано ранній guard у submit-flow:
    - якщо `editingId` заданий (`defined`), але не `usable`, обробник завершується.

- що покращило/виправило/додало:
  - Усунуто edge-case випадкового створення запису при зіпсованому internal state `editingId`.
  - Підвищено передбачуваність поведінки submit-flow без змін штатних сценаріїв.
