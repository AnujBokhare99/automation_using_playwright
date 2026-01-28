import { expect, type FrameLocator, type Page } from '@playwright/test';

type GotoTabOptions = {
  frameTimeoutMs?: number;
};

function getFrameTimeoutMs(options?: GotoTabOptions): number {
  if (typeof options?.frameTimeoutMs === 'number') return options.frameTimeoutMs;
  const fromEnv = Number.parseInt(process.env.PW_FRAME_TIMEOUT_MS ?? '', 10);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return 20_000;
}

async function getAppFrame(page: Page): Promise<FrameLocator> {
  const iframeCount = await page.locator('iframe').count();
  for (let i = 0; i < iframeCount; i++) {
    const frame = page.frameLocator('iframe').nth(i);
    if (
      await frame
        .getByRole('heading', { name: /playwright automation challenge/i })
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      return frame;
    }
  }

  throw new Error(
    `Could not find the Playwright Automation Challenge iframe (checked ${iframeCount} iframe(s)).`
  );
}

async function ensureNotCloudflareGated(page: Page): Promise<void> {
  const cloudflareGate = page.getByText(
    /verif(y|ying) you are human|needs to review the security of your connection/i
  );
  if (await cloudflareGate.isVisible({ timeout: 200 }).catch(() => false)) {
    await cloudflareGate.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => undefined);
  }
  if (await cloudflareGate.isVisible({ timeout: 200 }).catch(() => false)) {
    throw new Error(
      'Blocked by Cloudflare human verification. Your network/IP is being challenged, so the app iframe will not load. Try disabling VPN/corporate proxy or switching networks.'
    );
  }
}

async function getAppFrameWithRetry(page: Page, timeoutMs: number = 20_000): Promise<FrameLocator> {
  let lastError: unknown;
  await expect
    .poll(
      async () => {
        try {
          await ensureNotCloudflareGated(page);
        } catch (e) {
          lastError = e;
          return false;
        }

        try {
          await getAppFrame(page);
          return true;
        } catch (e) {
          lastError = e;
          return false;
        }
      },
      { timeout: timeoutMs }
    )
    .toBeTruthy();

  try {
    return await getAppFrame(page);
  } catch (e) {
    throw lastError instanceof Error ? lastError : e;
  }
}

export async function gotoTab(page: Page, tabName: string, options: GotoTabOptions = {}): Promise<FrameLocator> {
  await page.goto('/public/artifacts/1e02a9a5-4f20-4f19-a7ba-6c3f16c6eab9', {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  await page
    .waitForURL(/\/public\/artifacts\//, { timeout: 15_000 })
    .catch(() => undefined);

  await ensureNotCloudflareGated(page);

  const rejectCookies = page.locator('[data-testid="consent-reject"]').or(
    page.getByRole('button', { name: /reject all cookies/i })
  );
  const acceptCookies = page.locator('[data-testid="consent-accept"]').or(
    page.getByRole('button', { name: /accept all cookies/i })
  );
  if (await rejectCookies.isVisible({ timeout: 5000 }).catch(() => false)) {
    await rejectCookies.click({ timeout: 10_000 }).catch(() => undefined);
  } else if (await acceptCookies.isVisible({ timeout: 5000 }).catch(() => false)) {
    await acceptCookies.click({ timeout: 10_000 }).catch(() => undefined);
  }

  const app = await getAppFrameWithRetry(page, getFrameTimeoutMs(options));

  const tab = app.getByRole('button', { name: new RegExp(tabName, 'i') });
  await expect(tab).toBeVisible();
  await tab.click();

  const expectedHeading =
    tabName === 'Timing Challenges'
      ? /challenge 1:/i
      : tabName === 'Flaky Selectors'
        ? /challenge 2:/i
        : /challenge 3:/i;
  await expect(app.getByRole('heading', { name: expectedHeading })).toBeVisible();

  return app;
}
