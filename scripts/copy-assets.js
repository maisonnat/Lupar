import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const sizes = [16, 32, 48, 128]
const srcDir = path.join(root, 'src', 'assets')
const distDir = path.join(root, 'dist', 'src', 'assets')

fs.mkdirSync(distDir, { recursive: true })

for (const size of sizes) {
  const src = path.join(srcDir, `icon-${size}.png`)
  const dest = path.join(distDir, `icon-${size}.png`)
  fs.copyFileSync(src, dest)
  const stat = fs.statSync(dest)
  console.log(`Copied icon-${size}.png (${stat.size} bytes)`)
}

console.log('All assets copied to dist/')
