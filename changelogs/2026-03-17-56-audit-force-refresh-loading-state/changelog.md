# Changelog - 2026-03-17 - Audit force refresh loading state

## Що зроблено
- Для кнопки `Форс-оновлення` додано візуальний loading-стан (`disabled + spinner + текст "Оновлення..."`).
- Додано захист від повторного кліку під час виконання запиту.

## Технічні зміни
- Файл: `admin.html`
  - Оновлено кнопку форс-оновлення:
    - `id="audit-force-refresh-btn"`
    - `span#audit-force-refresh-label`
    - `span#audit-force-refresh-spinner` з `animate-spin`
    - класи `disabled:opacity-60 disabled:cursor-not-allowed`

- Файл: `admin.js`
  - Додано `setForceRefreshButtonLoading(isLoading)`.
  - `forceRefreshAuditNow()` перетворено в `async`:
    - ранній вихід, якщо кнопка вже `disabled`;
    - `try/finally` для гарантованого зняття loading-стану;
    - обробка помилок через існуючий `handleAuditLoadError`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- UX форс-оновлення став більш передбачуваним, а дублюючі запити від швидких повторних кліків усунено.