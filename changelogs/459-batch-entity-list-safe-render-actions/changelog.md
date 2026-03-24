# 459 Batch - Entity list safe render actions

як було:

- У списках releases/artists/events дані рендерились у шаблон карток частково без явної санітизації.
- Inline onclick для edit/delete напряму інтерполював `id` із запису.
- Для невалідного/небезпечного `id` існував ризик інʼєкції в атрибути або некоректного виклику дій.

що зроблено:

- Додано helper `serializeInlineEntityIdArg(id)`:
- нормалізує id через `normalizeEntityId`;
- дозволяє тільки usable id;
- number -> безпечний numeric arg;
- string -> дозволяє лише safe pattern `[A-Za-z0-9_-]+` і повертає quoted arg;
- інакше повертає `null`.
- Посилено рендер `loadReleases`:
- санітизація title/artist/genre/year/image перед interpolation;
- кнопки edit/delete отримують action лише при валідному id;
- при невалідному id дії disabled.
- Посилено рендер `loadArtists`:
- санітизація name/genre/bio/image;
- аналогічний guarded action flow для edit/delete.
- Посилено рендер `loadEvents`:
- санітизація title/date/time/venue/image;
- guarded action flow для edit/delete.

що покращило/виправило/додало:

- Знижено ризик HTML/attribute injection у картках entity-списків.
- Дії редагування/видалення стали безпечнішими для невалідних id.
- Для валідних записів UX і поведінка залишилися сумісними.
