# 453 Batch - Contact adapter preflight hardening

- як було:
  - Contact-flow (loadContacts/changeContactStatus/bulkUpdateContactStatus) викликав adapter-методи напряму.
  - При відсутності getContactRequests/updateContactRequestStatus можливі runtime-помилки.

- що зроблено:
  - loadContacts:
    - додано preflight через getAdapterMethod("getContactRequests");
    - при відсутності методу: warn + user alert + безпечний return;
    - виклик переведено на method.call(adapter).
  - changeContactStatus:
    - додано preflight для updateContactRequestStatus + getContactRequests;
    - при відсутності: warn + user alert + early return;
    - обидва виклики переведено на method.call(adapter).
  - bulkUpdateContactStatus:
    - додано preflight для updateContactRequestStatus + getContactRequests;
    - при відсутності: warn + user alert + early return;
    - Promise.all переведено на method.call(adapter);
    - повторне завантаження звернень також через method.call(adapter).

- що покращило/виправило/додало:
  - Знижено ризик падінь contact-flow при неповному adapter-контракті.
  - Додано контрольовану деградацію з повідомленням користувачу.
  - Базова поведінка для валідного adapter збережена.
