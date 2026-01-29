# NCR Project Changes Log

## 2026-01-28

### Session with Claude

1. **Merged branch `claude/review-project-overview-I8NRH` into `main`**
   - 5 commits with NCR workflow system implementation
   - Fixed signup trigger
   - Made Pending status red in approvals
   - Renamed app to NCR Jerusalem System
   - Replaced Google Fonts with system fonts

2. **Made approval role labels darker for better readability**
   - File: `src/app/cases/[id]/page.tsx`
   - Added `text-gray-700` to role names (Process Engineer, Engineering Manager, Operations Manager, QA Manager)
   - Commit: `061cb3e`

3. **Workflow History border** (reverted)
   - Tried removing left border from workflow history items
   - Reverted back to original with `border-l-4 border-gray-300 pl-4`

## 2026-01-29

### Playwright E2E Tests for Workflow

4. **Added Playwright testing framework**
   - Installed `@playwright/test` and Chromium browser
   - Created `playwright.config.ts`
   - Created `tests/test-users.ts` with all test account credentials
   - Created `tests/workflow-approval.spec.ts` - full approval chain test

5. **Workflow approval chain test** (ALL 6 TESTS PASSED!)
   - Test 1: Station Supervisor creates and submits NCR
   - Test 2: Process Engineer reviews and approves
   - Test 3: Engineering Manager reviews and approves
   - Test 4: Operations Manager reviews and approves
   - Test 5: QA Manager gives final approval
   - Test 6: Final state verification

   Run with: `npx playwright test --headed`
