import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  projects: [
    {
      name: 'extension',
    },
  ],
})
