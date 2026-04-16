# 2026-04-16-30 Release Save Legacy Schema Column Fallback

## Як було

- У проді при збереженні релізу (`PUT /api/releases/:id`) поверталась загальна помилка `500 INTERNAL_SERVER_ERROR`.
- При цьому операції з треками релізу (`PUT /api/release-tracks/:releaseId/:trackId`) проходили успішно.
- UI в адмінці показував повідомлення `Failed to save record. Check data and try again.` без можливості діагностувати причину на фронтенді.

## Що зроблено

- У `backend/src/db/repository.js` додано schema-aware fallback для CRUD по `releases`:
- визначення наявних колонок таблиці `releases` через `information_schema.columns`;
- кешування переліку колонок у процесі бекенду;
- динамічний вибір write-колонок для `createByType` і `updateByType`.
- Для `releases` create/update тепер автоматично пропускають відсутні в схемі колонки (наприклад `release_type`, `release_date`) замість падіння SQL-запиту.
- Додано retry-прохід із примусовим refresh кешу колонок при SQL-помилці `42703` (undefined_column).

## Що покращило/виправило/додало

- Усунуто клас падінь `500` при збереженні релізів у середовищах з частково відсталими міграціями схеми.
- Збереження релізу стало сумісним із legacy-схемою БД без відкату UI/контрактів API.
- Зменшено ризик блокування контент-операцій в адмінці через schema drift між середовищами.
