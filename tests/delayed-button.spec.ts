import { test, expect } from '@playwright/test';
import { gotoTab } from './_helpers';

test('Delayed Button Flow', async ({ page }) => {
  const app = await gotoTab(page, 'Timing Challenges');

  await app.getByRole('button', { name: 'Start Process' }).click();

  const confirmButton = app.getByRole('button', { name: 'Confirm Action' });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  await expect(app.getByText(/success/i)).toBeVisible();
});
