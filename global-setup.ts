import { chromium, type FullConfig, expect } from '@playwright/test';

const ARTIFACT_URL = 'https://claude.ai/public/artifacts/1e02a9a5-4f20-4f19-a7ba-6c3f16c6eab9';
const STORAGE_STATE_PATH = 'playwright/.auth/storageState.json';

async function ensureNotCloudflareGated(page: import('@playwright/test').Page) {
  const cloudflareGate = page.getByText(/verif(y|ying) you are human|needs to review the security of your connection/i);
  if (await cloudflareGate.isVisible({ timeout: 200 }).catch(() => false)) {
    await cloudflareGate.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => undefined);
  }
  if (await cloudflareGate.isVisible({ timeout: 200 }).catch(() => false)) {
    throw new Error('Blocked by Cloudflare human verification during global setup.');
  }
}

async function getAppFrame(page: import('@playwright/test').Page) {
  const iframeCount = await page.locator('iframe').count();
  for (let i = 0; i < iframeCount; i++) {
    const frame = page.frameLocator('iframe').nth(i);
    if (
      await frame
        .getByRole('heading', { name: /playwright automation challenge/i })
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      return frame;
    }
  }

  throw new Error(
    `Could not find the Playwright Automation Challenge iframe during global setup (checked ${iframeCount} iframe(s)).`
  );
}

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch({ headless: process.env.PW_SETUP_HEADED !== '1', channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(ARTIFACT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  await page.waitForURL(/\/public\/artifacts\//, { timeout: 30_000 }).catch(() => undefined);

  try {
    await ensureNotCloudflareGated(page);
  } catch (e) {
    await browser.close();
    throw e;
  }

  const rejectCookies = page.locator('[data-testid="consent-reject"]').or(
    page.getByRole('button', { name: /reject all cookies/i })
  );
  const acceptCookies = page.locator('[data-testid="consent-accept"]').or(
    page.getByRole('button', { name: /accept all cookies/i })
  );
  if (await rejectCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rejectCookies.click({ timeout: 10_000 }).catch(() => undefined);
  } else if (await acceptCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptCookies.click({ timeout: 10_000 }).catch(() => undefined);
  }

  try {
    await ensureNotCloudflareGated(page);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
  } catch (e) {
    await browser.close();
    throw e;
  }

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
