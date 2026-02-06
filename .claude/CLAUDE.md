# NCR Project Context

## Overview
NCR (Non-Conformance Report) Jerusalem System — веб-приложение для управления несоответствиями на производстве. Полный workflow от создания NCR до финального одобрения через цепочку ролей.

## Tech Stack
- **Frontend:** Next.js 15.1.11 (App Router), React 18, TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4
- **State:** Zustand (useAuthStore, useNCRStore) + React Context (AuthProvider)
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Testing:** Playwright (E2E)
- **Task Tracking:** Beads (bd CLI, `.beads/` directory)

## Project Structure
```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── page.tsx            # Landing → auto-redirect to dashboard
│   ├── layout.tsx          # Root layout (AuthProvider, Navigation)
│   ├── auth/login/         # Login page
│   ├── auth/signup/        # Signup page
│   ├── dashboard/          # Stats, NCRs by stage
│   ├── cases/              # NCR list (filtering, my/all toggle)
│   ├── cases/new/          # Create NCR form
│   └── cases/[id]/         # NCR detail (workflow, comments, actions)
├── components/             # Reusable UI
│   ├── Button.tsx          # variant: primary/secondary/danger/ghost, size: sm/md/lg
│   ├── FormElements.tsx    # Input, Select, Textarea with labels/errors
│   └── Navigation.tsx      # Top navbar, user info, logout
├── lib/                    # Business logic
│   ├── api.ts              # 25+ API functions (auth, users, NCR CRUD, workflow, comments, dashboard)
│   ├── types.ts            # Types, roles, stages, ROLE_CONFIG, WORKFLOW_TRANSITIONS
│   ├── auth-context.tsx    # AuthProvider, useAuth() hook
│   ├── store.ts            # Zustand stores
│   └── supabase.ts         # Supabase client init
└── globals.css             # Global styles
tests/
├── test-users.ts           # 8 test users (one per role)
└── workflow-approval.spec.ts  # Full approval chain E2E test
schema.sql                  # Full DB schema (6 tables, 9 indexes, 11 RLS policies)
```

## Commands
```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx playwright test  # Run E2E tests
npx playwright test --ui  # Tests with UI
bd list              # Beads tasks
bd ready             # Ready tasks
bd create "Title"    # New task
```

## Environment Variables (.env.local — NOT in git)
```
NEXT_PUBLIC_SUPABASE_URL=https://dmehfmeglsafcanufcvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## User Roles (9)
| Role | Description | Key Stages |
|------|-------------|------------|
| station_supervisor | Creates/submits NCRs | draft, rework |
| process_engineer | Reviews, batch decisions | pe_review |
| engineering_manager | Approves PE decisions | em_review |
| product_manager | Reviews batch decisions | pm_review |
| operations_manager | Approves EM decisions | om_review |
| qa_manager | Final approval, requests marketing | qa_review |
| marketing_manager | Reviews when requested by QA | marketing_review |
| production_control | Receives submissions, monitors | submitted |
| admin | Full access to all stages | all |

## Workflow Stages (11)
```
draft → submitted → pe_review → em_review → pm_review → om_review → qa_review → approved
                                                                         ↓
                                                                 marketing_review (optional)
                                                                         ↓
                                                                   qa_review → approved

Any stage → rework → pe_review (returns after rework)
Final states: approved, rejected
```

## Database (Supabase/PostgreSQL)
6 tables: `users`, `workflow_stages`, `ncr`, `workflow_transitions`, `ncr_comments`, `ncr_attachments`
- NCR numbers auto-generated via sequence + trigger
- RLS enforced — roles see only their NCRs
- 6 approval flags on NCR: pe_approved, em_approved, pm_approved, om_approved, qa_approved, marketing_approved
- batch_decision: pending/accept/partially_accept/reject/rework

## Key Functions (src/lib/api.ts)
- `executeWorkflowAction(ncr, user, action, comments, additionalData)` — main workflow engine
- `canUserActOnNCR(ncr, user)` / `getAvailableActions(ncr, user)` — permission helpers (in types.ts)
- `getDashboardStats(user)` — dashboard data
- `createNCR()` / `updateNCR()` / `getNCRs()` — CRUD

## Auth Flow
1. Signup → Supabase auth → user profile created
2. Login → getCurrentUser() → stored in Zustand + Context
3. AuthProvider wraps app, checks auth on load
4. Protected routes redirect to /auth/login if not authenticated

## Development Notes
- All pages use `'use client'` (client-side rendering)
- Reuse existing components (Button, FormElements, Navigation) — don't create new ones
- Follow existing patterns in api.ts for new API functions
- All DB queries go through Supabase client with RLS
- Tests run sequentially (serial mode in Playwright)
