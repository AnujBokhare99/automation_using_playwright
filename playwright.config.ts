import { defineConfig, devices } from '@playwright/test';

const useStorageState = process.env.PW_USE_STORAGE_STATE === '1';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  workers: 1,
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  globalSetup: useStorageState ? './global-setup.ts' : undefined,
  use: {
    baseURL: 'https://claude.ai',
    storageState: useStorageState ? 'playwright/.auth/storageState.json' : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
