# Changelog - 2026-03-18 - Settings unsaved toast close Escape bubbling guard

## Як було
- На кнопці закриття toast натискання Escape викликало `dismissSettingsUnsavedToast(event)`, але подія могла пробаблитись до контейнера toast (`onkeydown`).
- Це давало дубльований виклик dismiss (другий виклик швидко завершувався, бо toast уже закритий).

## Що зроблено
- Файл: admin.js
  - У `handleSettingsUnsavedToastCloseButtonKeydown(event)` для гілки `Escape` додано `event.stopPropagation()` перед dismiss.

## Що покращило
- Прибрано зайве дублювання обробки Escape по bubbling-ланцюгу.
- Чистіший і детермінованіший keyboard-flow для кнопки закриття.
- Сумісно з поточною логікою dismiss та guard-станами toast.

## Валідація
- Статичні перевірки:
  - admin.js: без помилок
  - admin.html: без помилок
- Smoke API:
  - settingsOk=True; okPage=1; okTotal=5; okItems=1
