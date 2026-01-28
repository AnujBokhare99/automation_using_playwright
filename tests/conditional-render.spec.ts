import { test, expect } from '@playwright/test';
import { gotoTab } from './_helpers';

test('Conditional Login Flow', async ({ page }) => {
  const app = await gotoTab(page, 'Flaky Selectors', { frameTimeoutMs: 45_000 });

  await app.getByRole('button', { name: 'Admin User' }).click();

  const conditionalCard = app.locator('div', {
    has: app.getByRole('heading', { name: '2.5 Conditional Rendering' }),
  });

  const adminWelcome = conditionalCard.getByText(/welcome,\s*admin user!/i);
  const standardWelcome = conditionalCard.getByText(/welcome,\s*standard user!/i);
  const adminPanel = conditionalCard.getByText(/admin panel/i);
  const userDashboard = conditionalCard.getByText(/user dashboard/i);

  await expect(adminWelcome).toBeVisible();
  await expect(adminPanel).toBeVisible();
  await expect(standardWelcome).toBeHidden();
  await expect(userDashboard).toBeHidden();

  await conditionalCard.getByRole('button', { name: 'Logout' }).click();

  await conditionalCard.getByRole('button', { name: 'Standard User' }).click();

  await expect(standardWelcome).toBeVisible();
  await expect(userDashboard).toBeVisible();
  await expect(adminWelcome).toBeHidden();
  await expect(adminPanel).toBeHidden();
});
