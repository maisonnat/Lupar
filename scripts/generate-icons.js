import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [16, 32, 48, 128]
const svgPath = path.resolve(__dirname, 'icon-source.svg')
const outDir = path.resolve(__dirname, '..', 'src', 'assets')

const svgBuffer = fs.readFileSync(svgPath)

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}.png`)
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath)
  const stat = fs.statSync(outPath)
  console.log(`Generated ${path.basename(outPath)} (${stat.size} bytes)`)
}

console.log('All icons generated successfully')
