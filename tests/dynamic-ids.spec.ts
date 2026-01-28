import { test, expect } from '@playwright/test';
import { gotoTab } from './_helpers';

test('Dynamic ID Handling', async ({ page }) => {
  const app = await gotoTab(page, 'Flaky Selectors');

  const dynamicIdsCard = app.locator('div', {
    has: app.getByRole('heading', { name: '2.1 Dynamic IDs' }),
  });

  await dynamicIdsCard.getByTestId('regenerate-ids').click();

  await dynamicIdsCard.getByText(/^Beta$/).click();

  await expect(dynamicIdsCard.getByText(/selected:\s*beta/i)).toBeVisible();
});
