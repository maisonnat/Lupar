import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

const mockStore: Record<string, unknown> = {}

const mockChrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        const result: Record<string, unknown> = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        keyList.forEach((k) => {
          if (mockStore[k] !== undefined) result[k] = mockStore[k]
        })
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStore, items)
        return Promise.resolve()
      }),
      remove: vi.fn((keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys]
        keyList.forEach((k) => {
          delete mockStore[k]
        })
        return Promise.resolve()
      }),
      clear: vi.fn(() => {
        Object.keys(mockStore).forEach((k) => delete mockStore[k])
        return Promise.resolve()
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  webNavigation: {
    onCompleted: {
      addListener: vi.fn(),
    },
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).chrome = mockChrome

export { mockStore, mockChrome }
