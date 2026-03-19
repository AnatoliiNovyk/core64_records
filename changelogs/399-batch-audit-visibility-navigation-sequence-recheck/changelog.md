# Batch 399: Audit Visibility Navigation Sequence Recheck

## Як було
- `handleAuditVisibilityChange` мав `sectionNavigationSeq` snapshot і перевірку в `.catch`, але перед `setupAuditAutoRefresh()` та одразу після нього не було явного sequence recheck.
- У граничному race-сценарії між visibility change та ре-ініціалізацією refresh flow могла відбутися зміна navigation generation.

## Що зроблено
- У `handleAuditVisibilityChange` додано:
  - `if (sectionNavigationSeq !== navigationSeqAtVisibility) return;` перед `setupAuditAutoRefresh();`
  - `if (sectionNavigationSeq !== navigationSeqAtVisibility) return;` одразу після `setupAuditAutoRefresh();` і перед `loadAuditLogs()`

## Що покращило / виправило / додало
- Додатково звужено race-вікно при поверненні вкладки у visibility-driven audit flow.
- Посилено гарантію, що refresh/logs ре-ініціалізація виконується тільки в актуальному navigation generation.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
