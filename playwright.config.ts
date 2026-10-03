import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5191',
    viewport: { width: 360, height: 740 },
    // Run the designed animations; the app ignores system motion preferences.
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run test:serve',
    url: 'http://127.0.0.1:5191',
    reuseExistingServer: false,
  },
})
