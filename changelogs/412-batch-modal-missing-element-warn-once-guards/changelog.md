# Batch 412: Modal Missing Element Warn-Once Guards

## Як було

При відсутньому `modal-form` warning у fallback-гілці міг логуватись повторно при повторних ініціалізаціях.
Для відсутнього `modal` overlay не було симетричного fallback warning, що ускладнювало діагностику DOM-інтеграції.

## Що зроблено

Додано два глобальні одноразові прапорці:

- `modalFormMissingWarned`
- `modalOverlayMissingWarned`

Оновлено fallback-гілку для `modal-form`:

- warning тепер логується лише один раз за сесію.

Додано fallback-гілку для `modal` overlay:

- warning також логується один раз за сесію.

## Що покращило / виправило / додало

Зменшено повторний лог-шум у консолі.
Покращено observability проблем із відсутніми modal DOM-елементами.
Збережено безпечну поведінку без runtime-падінь.

## Validation

Diagnostics check for `admin.js`: **No errors found**.
