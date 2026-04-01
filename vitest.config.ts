import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@background': resolve(__dirname, 'src/background'),
      '@options': resolve(__dirname, 'src/options'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@test-utils': resolve(__dirname, 'src/test-utils'),
    },
  },
})
