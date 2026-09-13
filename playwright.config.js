const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.LASTSET_BASE_URL || 'https://lastset-training-log.thivagar2719.workers.dev/';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL,
    timezoneId: 'Asia/Kuala_Lumpur',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        ...devices['iPhone 13']
      }
    },
    {
      name: 'mobile-webkit',
      use: {
        browserName: 'webkit',
        ...devices['iPhone 13']
      }
    }
  ]
});
