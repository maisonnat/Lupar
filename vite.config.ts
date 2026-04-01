import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import webExtension from 'vite-plugin-web-extension'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    webExtension({
      manifest: 'manifest.json',
    }),
    {
      name: 'remove-crossorigin',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return html.replace(/ crossorigin/g, '')
        },
      },
    },
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@options': path.resolve(__dirname, 'src/options'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@test-utils': path.resolve(__dirname, 'src/test-utils'),
    },
  },
})
