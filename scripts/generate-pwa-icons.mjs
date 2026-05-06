/**
 * Gera icon-192.png e icon-512.png a partir de public/icon.svg (requisito comum do Chrome para instalação).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function main() {
  const sharp = (await import('sharp')).default
  const svg = await readFile(join(root, 'public', 'icon.svg'))

  for (const size of [192, 512]) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer()
    const out = join(root, 'public', `icon-${size}.png`)
    await writeFile(out, buf)
    console.log('Wrote', out)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
