# 456 Batch - Loader payload shape normalization

- як було:
  - Loader-и та audit/export flow припускали коректні типи даних від adapter (array/object).
  - При невалідному payload (null, primitive, mixed array) можливі падіння у map/sort/length або доступі до полів.

- що зроблено:
  - Додано універсальні helper-и нормалізації:
    - normalizeRecordObject
    - normalizeRecordArray
    - normalizeAuditFacetsPayload
  - refreshCache:
    - нормалізація releases/artists/events до масивів обʼєктів;
    - нормалізація settings до plain object.
  - loadDashboard:
    - підрахунки карток переведені на нормалізовані масиви.
  - loadReleases/loadArtists/loadEvents:
    - нормалізація payload перед cache assignment та рендером.
  - loadSettings:
    - нормалізація settings payload перед використанням полів.
  - loadContacts:
    - нормалізація contactRequests до масиву валідних обʼєктів.
  - loadAuditLogs:
    - response нормалізується перед читанням items/total/page;
    - facets нормалізуються через normalizeAuditFacetsPayload.
  - populateAuditFilterOptions:
    - побудова options працює з нормалізованими facets.
  - getFilteredAuditLogs:
    - повертає нормалізований масив.
  - exportAuditCsv:
    - response та items нормалізуються перед експортом.

- що покращило/виправило/додало:
  - Підвищено стійкість UI до пошкоджених або неочікуваних payload-відповідей adapter.
  - Знижено ризик runtime-помилок у ключових data-loading та audit-export сценаріях.
  - Штатна поведінка для валідних даних збережена.
