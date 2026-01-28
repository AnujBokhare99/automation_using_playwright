import { test, expect } from '@playwright/test';
import { gotoTab } from './_helpers';

test('Modal Confirmation Flow', async ({ page }) => {
  const app = await gotoTab(page, 'Responsive');

  await app.getByRole('button', { name: 'Open Modal' }).click();

  const firstModalHeading = app.getByRole('heading', { name: 'Confirmation Required' });
  await expect(firstModalHeading).toBeVisible();
  await app.getByRole('button', { name: 'Show Details' }).click();

  const nestedModalHeading = app.getByRole('heading', { name: /final confirmation/i });
  await expect(nestedModalHeading).toBeVisible();
  await app.getByRole('button', { name: 'Confirm' }).click();

  await expect(firstModalHeading).toBeHidden();
  await expect(nestedModalHeading).toBeHidden();
  await expect(app.getByText(/result:\s*confirmed/i)).toBeVisible();
});
