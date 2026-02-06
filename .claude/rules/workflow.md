# NCR Workflow Rules

## State Machine
NCR проходит через стадии. Переходы определены в `WORKFLOW_TRANSITIONS` (src/lib/types.ts).

### Основной путь (happy path)
```
draft → submitted → pe_review → em_review → pm_review → om_review → qa_review → approved
```

### Опциональная ветка (marketing)
QA Manager может запросить marketing review:
```
qa_review → marketing_review → qa_review → approved
```

### Rework (доработка)
С любой стадии можно отправить на rework:
```
any_stage → rework → pe_review
```
Station Supervisor вносит исправления в rework, затем NCR возвращается на pe_review.

## Роли и стадии

| Стадия | Кто действует | Доступные действия |
|--------|--------------|-------------------|
| draft | station_supervisor | submit |
| submitted | production_control, admin | send_to_pe |
| pe_review | process_engineer | accept_batch, partially_accept, reject_batch, request_rework |
| em_review | engineering_manager | approve, reject, request_rework |
| pm_review | product_manager | approve, reject, request_rework |
| om_review | operations_manager | approve, reject, request_rework |
| qa_review | qa_manager | final_approve, reject, request_marketing, request_rework |
| marketing_review | marketing_manager | approve, reject, request_rework |
| rework | station_supervisor | submit_rework |

## Batch Decisions (PE Review)
Process Engineer принимает решение по батчу:
- **accept** — принять полностью (pe_approved = true)
- **partially_accept** — частично принять
- **reject** — отклонить батч
- **rework** — отправить на доработку

## Approval Flags (на таблице ncr)
Каждый менеджер ставит свой флаг:
- `pe_approved` — Process Engineer
- `em_approved` — Engineering Manager
- `pm_approved` — Product Manager
- `om_approved` — Operations Manager
- `qa_approved` — QA Manager
- `marketing_approved` — Marketing Manager

## Аудит
Все переходы логируются в таблицу `workflow_transitions`:
- from_stage, to_stage
- from_user_id, to_user_id
- action, decision, comments
- created_at

## Ключевые функции
- `executeWorkflowAction()` в api.ts — основной движок переходов
- `canUserActOnNCR()` в types.ts — проверка может ли юзер действовать
- `getAvailableActions()` в types.ts — список доступных действий для роли
- `ROLE_CONFIG` в types.ts — конфигурация прав по ролям
