# 450 Batch - Modal/upload/settings/reset hardening

- як було:
  - Перевірка image upload спиралась лише на MIME-тип файлу.
  - saveSettings очікував коректний object в options без окремої нормалізації.
  - resetData виконувався без явного preflight-контролю доступності localStorage/adapter/location.
  - addActivity приймав довільний text без явного захисту від null/undefined/порожніх значень.

- що зроблено:
  - Додано централізовані upload helper-и:
    - MAX_UPLOAD_IMAGE_BYTES
    - SUPPORTED_UPLOAD_IMAGE_TYPES
    - SUPPORTED_UPLOAD_IMAGE_EXTENSIONS
    - hasSupportedUploadImageType
    - hasSupportedUploadImageExtension
    - isSupportedUploadImage
  - handleFileUpload посилено:
    - guard на валідний numeric file.size;
    - fallback-підтримка формату за розширенням файлу, якщо MIME порожній/некоректний;
    - уніфікація ліміту розміру через константу MAX_UPLOAD_IMAGE_BYTES.
  - Для saveSettings додано normalizeSaveSettingsOptions і переведено обробку notifySuccess на нормалізовані options.
  - resetData посилено preflight-перевірками середовища перед скиданням:
    - localStorage.removeItem
    - adapter.ensureLocalDefaults
    - location.reload
  - addActivity посилено:
    - ранній return для null/undefined;
    - приведення text до рядка;
    - відсікання порожніх/whitespace записів.

- що покращило/виправило/додало:
  - Підвищено стабільність upload-flow у браузерах/сценаріях з неповним MIME.
  - Знижено ризик runtime-помилок у save/reset при нетипових аргументах або середовищі.
  - Лог активності став стійкішим до невалідного вхідного значення.
  - Поведінка для валідних сценаріїв залишилась без змін.
