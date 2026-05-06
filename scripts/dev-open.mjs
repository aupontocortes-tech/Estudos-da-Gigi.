/**
 * Sobe `next dev` e abre o navegador na mesma URL que o Next anuncia em "Local:"
 * (evita abrir :3000 quando o servidor caiu em :3001, e evita 127.0.0.1 vs localhost no HMR).
 */
import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import { copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = process.env.PORT || '3000'
const FALLBACK_URL = `http://localhost:${PORT}`
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SQL_WASM_SRC = join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const SQL_WASM_DEST = join(ROOT, 'public', 'sql-wasm.wasm')
const SQL_WASM_BROWSER_DEST = join(ROOT, 'public', 'sql-wasm-browser.wasm')

function openBrowser(url) {
  const p = platform()
  if (p === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
  } else if (p === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
  }
}

async function ensureSqlWasm() {
  try {
    await copyFile(SQL_WASM_SRC, SQL_WASM_DEST)
    await copyFile(SQL_WASM_SRC, SQL_WASM_BROWSER_DEST)
  } catch {
    // Se não conseguir copiar aqui, o app ainda tenta CDN no runtime.
  }
}

await ensureSqlWasm()

const child = spawn('npx', ['next', 'dev', '--webpack'], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true,
  env: { ...process.env },
})

let opened = false
let stdoutBuf = ''

child.stdout?.on('data', (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  stdoutBuf += text
  if (opened) return
  const m = stdoutBuf.match(/-\s*Local:\s+(https?:\/\/[^\s]+)/)
  if (m) {
    opened = true
    openBrowser(m[1])
  }
})

async function fallbackOpen() {
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (opened) return
    try {
      const res = await fetch(FALLBACK_URL, { redirect: 'manual' })
      if (res.ok || res.status === 304 || res.status === 307 || res.status === 308) {
        if (!opened) {
          opened = true
          openBrowser(FALLBACK_URL)
        }
        return
      }
    } catch {
      /* ainda não subiu */
    }
  }
}

fallbackOpen().catch(() => {})

child.on('exit', (code) => process.exit(code ?? 0))
