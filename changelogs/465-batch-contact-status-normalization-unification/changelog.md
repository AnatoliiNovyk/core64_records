# 465 Batch - Contact status normalization unification

- як було:
  - Нормалізація статусу звернень була частково розпорошена.
  - У filter/update flows статуси оброблялись без trim/lowercase-safe уніфікації.
  - Це могло давати неузгодженість при нетипових рядках статусу.

- що зроблено:
  - Додано централізований helper:
    - `normalizeSupportedContactRequestStatus(status)` -> `new|in_progress|done|null`.
  - Оновлено `isSupportedContactRequestStatus`:
    - тепер базується на новому helper-і.
  - Оновлено `normalizeContactRequestStatus`:
    - тепер повертає нормалізований статус або `new`.
  - Оновлено `normalizeContactsStatusFilter`:
    - тепер повертає нормалізований статус або `all`.
  - Оновлено `changeContactStatus`:
    - використовує `normalizedStatus` для валідації, adapter-виклику та activity log.
  - Оновлено `bulkUpdateContactStatus`:
    - `fromStatus/toStatus` нормалізуються на вході;
    - відбір targets й update виклик працюють з нормалізованими значеннями;
    - activity log відображає нормалізовані статуси.

- що покращило/виправило/додало:
  - Єдина точка правди для status-нормалізації в contacts-flow.
  - Підвищена стійкість до нетипових рядків (пробіли/регістр).
  - Збережена сумісність валідних штатних сценаріїв.
