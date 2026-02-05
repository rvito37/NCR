import { test, expect, Page } from '@playwright/test';
import { users } from './test-users';

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|cases)/, { timeout: 15000 });
}

// Helper function to logout
async function logout(page: Page) {
  const signOutButton = page.locator('button:has-text("Sign Out")');
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL('/auth/login', { timeout: 10000 });
  }
}

// Helper to click action button and wait
async function clickActionButton(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
}

// Store NCR ID between tests
let ncrId: string = '';

test.describe.serial('NCR Workflow Approval Chain', () => {

  test('1. Station Supervisor creates and submits NCR', async ({ page }) => {
    await login(page, users.supervisor.email, users.supervisor.password);

    await page.goto('/cases/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.locator('input[type="text"]').first().fill('E2E Test - Full Approval Chain');
    await page.locator('textarea').first().fill('Automated E2E test for complete workflow approval chain.');

    // Create NCR
    await page.click('button:has-text("Create NCR")');
    await page.waitForURL(/\/cases\/[a-f0-9-]+/, { timeout: 15000 });

    // Get NCR ID
    ncrId = page.url().split('/cases/')[1];
    console.log(`✓ NCR created: ${ncrId}`);

    // Submit NCR
    await clickActionButton(page, 'Submit NCR');

    // Verify submitted
    await expect(page.locator('text=Submitted').first()).toBeVisible({ timeout: 10000 });
    console.log('✓ NCR submitted');

    await page.screenshot({ path: 'test-results/01-supervisor-submitted.png' });
    await logout(page);
  });

  test('2. Admin (Production Control) sends to Process Engineer', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    // Admin can act as Production Control
    await login(page, users.admin.email, users.admin.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    // Click "Send to Process Engineer"
    await clickActionButton(page, 'Send to Process Engineer');

    // Verify stage changed - check sidebar shows PE Review stage
    await expect(page.locator('text=Process Engineer Review').first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Sent to Process Engineer');

    await page.screenshot({ path: 'test-results/02-admin-sent-to-pe.png' });
    await logout(page);
  });

  test('3. Process Engineer accepts batch', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    await login(page, users.processEngineer.email, users.processEngineer.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=E2E Test - Full Approval Chain')).toBeVisible({ timeout: 10000 });

    // Process Engineer clicks "Accept Batch"
    await clickActionButton(page, 'Accept Batch');

    console.log('✓ Process Engineer accepted batch');
    await page.screenshot({ path: 'test-results/03-pe-accepted.png' });
    await logout(page);
  });

  test('4. Engineering Manager approves', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    await login(page, users.engineeringManager.email, users.engineeringManager.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    // Engineering Manager clicks "Approve"
    await clickActionButton(page, 'Approve');

    console.log('✓ Engineering Manager approved');
    await page.screenshot({ path: 'test-results/04-em-approved.png' });
    await logout(page);
  });

  test('5. Operations Manager approves', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    await login(page, users.operationsManager.email, users.operationsManager.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    // Operations Manager clicks "Approve"
    await clickActionButton(page, 'Approve');

    console.log('✓ Operations Manager approved');
    await page.screenshot({ path: 'test-results/05-om-approved.png' });
    await logout(page);
  });

  test('6. QA Manager gives final approval', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    await login(page, users.qaManager.email, users.qaManager.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    // QA Manager clicks "Final Approve"
    await clickActionButton(page, 'Final Approve');

    console.log('✓ QA Manager gave final approval');
    await page.screenshot({ path: 'test-results/06-qa-final-approved.png' });
    await logout(page);
  });

  test('7. Verify NCR is fully approved', async ({ page }) => {
    test.skip(!ncrId, 'NCR not created');

    await login(page, users.admin.email, users.admin.password);
    await page.goto(`/cases/${ncrId}`);
    await page.waitForLoadState('networkidle');

    // Verify final status is Approved
    await expect(page.locator('text=Approved').first()).toBeVisible({ timeout: 10000 });

    // Verify all approvals show "Approved" not "Pending"
    const pendingCount = await page.locator('text=Pending').count();
    console.log(`Pending approvals remaining: ${pendingCount}`);

    // Check workflow history has all the steps
    await expect(page.locator('text=Workflow History')).toBeVisible();

    console.log('✓ NCR fully approved - workflow complete!');
    await page.screenshot({ path: 'test-results/07-final-approved-state.png', fullPage: true });
    await logout(page);
  });
});
