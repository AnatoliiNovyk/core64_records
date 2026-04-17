# 2026-04-17-19 Deploy Validation Order Troubleshooting Docs

## Як було

- У документації було зазначено наявність optional candidate preflight, але порядок pre-flight кроків у deploy workflow не був явно розписаний.
- У cutover-сценаріях це ускладнювало діагностику: не було чітко зафіксовано, що candidate preflight у deploy запускається лише після GCP prerequisites перевірок.

## Що зроблено

- У `GOOGLE_RUN_DEPLOYMENT.md` додано явний порядок pre-flight етапів у deploy workflow:
- валідація input/release-owner;
- валідація Artifact Registry + Secret Manager;
- optional candidate DB preflight;
- runtime config validation і подальші кроки.
- У `GOOGLE_RUN_DEPLOYMENT.md` додано розділ `Cutover troubleshooting` з практичними вказівками:
- що робити, якщо workflow падає на `Validate GCP resources and secrets`;
- які параметри очікуються для `core64records` (`artifact_repo=core64`, `gcp_region=europe-west1`);
- як трактувати падіння `Run candidate Postgres cutover preflight`.
- У `RELEASE_RUNBOOK.md` додано `Deploy cutover troubleshooting notes` з поясненням fixed order у deploy workflow та рекомендацією використовувати `Pre-Release Gate` для найранішого candidate preflight сигналу.

## Що покращило/виправило/додало

- Зменшено діагностичну неоднозначність між інфраструктурними блокерами (GCP/IAM/Artifact/Secrets) і реальними проблемами кандидатної DB-цілі.
- Підвищено операційну передбачуваність cutover перевірок без зміни порядку кроків у deploy workflow.
- Прискорено triage під час релізу: команда тепер має явний маршрут дій для обох класів збоїв.
