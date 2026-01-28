import { test, expect } from '@playwright/test';
import { gotoTab } from './_helpers';

test('Load and Verify List Items', async ({ page }) => {
  const app = await gotoTab(page, 'Timing Challenges');

  const lazyListCard = app.locator('div', {
    has: app.getByRole('heading', { name: '1.2 Lazy Loaded List' }),
  });

  const loadMore = lazyListCard.getByRole('button', { name: 'Load More Items' });

  const items = lazyListCard.getByText(/^Item\s+\d+$/);

  let currentCount = await items.count();
  for (let i = 0; i < 3; i++) {
    await loadMore.click();

    const expectedCount = currentCount + 5;
    await expect(items).toHaveCount(expectedCount);
    currentCount = expectedCount;
  }

  await expect(items).toHaveCount(15);

  await expect(lazyListCard.getByText(/^active$/i).first()).toBeVisible();
  await expect(lazyListCard.getByText(/^pending$/i).first()).toBeVisible();
});
