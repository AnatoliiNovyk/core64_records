# 432 Batch - ID=0 flow fix and upload copy sync

як було:

- У modal/edit submit логіці використовувались truthy/falsy перевірки (`||`, `!!`), через що `id = 0` міг некоректно переходити в create-flow.
- У UI-підказках для upload був текст `2MB`, хоча реальна валідація обмежувала файл до `500KB`.

що зроблено:

- У `openModal` змінено присвоєння `editingId` з `normalizedId || null` на `normalizedId ?? null`.
- У submit-обробнику модалки змінено визначення edit-режиму на явну перевірку `null/undefined`.
- У submit-обробнику модалки змінено fallback id з `editingIdAtSubmit || Date.now()` на `editingIdAtSubmit ?? Date.now()`.
- Оновлено три тексти UI-підказок про розмір файлу: `2MB` -> `500KB`.

що покращило/виправило/додало:

- Усунуто ризик помилкового create-flow для валідного `id = 0`.
- Вирівняно поведінку modal/edit submit із коректною семантикою nullable значень.
- Прибрано розбіжність між фактичним лімітом upload і текстом у UI.
