import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 7000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 900 }
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
  reporter: 'list'
});
