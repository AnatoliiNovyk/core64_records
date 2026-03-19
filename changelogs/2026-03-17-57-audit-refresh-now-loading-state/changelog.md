# Changelog - 2026-03-17 - Audit refresh-now loading state

## Що зроблено
- Додано loading-стан для кнопки `Оновити зараз` у секції аудиту.
- Додано захист від повторних кліків під час активного запиту (`disabled` + ранній вихід у handler).

## Технічні зміни
- Файл: `admin.html`
  - Кнопку `Оновити зараз` оновлено до структурованої розмітки:
    - `id="audit-refresh-now-btn"`
    - `span#audit-refresh-now-label`
    - `span#audit-refresh-now-spinner`
  - Додано стилі для disabled-стану (`disabled:opacity-60`, `disabled:cursor-not-allowed`).

- Файл: `admin.js`
  - Додано `setRefreshNowButtonLoading(isLoading)`.
  - `refreshAuditNow()` перетворено в `async`:
    - перевірка `button.disabled` для антидублювання;
    - `try/finally` для гарантованого зняття loading-стану;
    - помилки обробляються через `handleAuditLoadError(...)`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Обидві кнопки ручного оновлення в аудиті (`Оновити зараз` і `Форс-оновлення`) тепер мають консистентний UX та захист від дубль-запитів.