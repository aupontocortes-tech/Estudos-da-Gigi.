import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const dest = join(root, 'public', 'sql-wasm.wasm')
const destBrowser = join(root, 'public', 'sql-wasm-browser.wasm')

if (!existsSync(src)) {
  console.warn('[copy-sql-wasm] sql-wasm.wasm não encontrado em node_modules — rode npm install')
  process.exit(0)
}
copyFileSync(src, dest)
copyFileSync(src, destBrowser)
console.log('[copy-sql-wasm] Copiado para public/sql-wasm.wasm')
