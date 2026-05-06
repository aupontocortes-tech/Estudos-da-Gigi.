/**
 * Sobe `next dev` e abre o navegador em http://localhost:PORT quando responder.
 */
import { spawn } from 'node:child_process'
import { platform } from 'node:os'

const PORT = process.env.PORT || '3000'
const URL = `http://127.0.0.1:${PORT}`

function openBrowser() {
  const p = platform()
  if (p === 'win32') {
    spawn('cmd', ['/c', 'start', '', URL], { detached: true, stdio: 'ignore' }).unref()
  } else if (p === 'darwin') {
    spawn('open', [URL], { detached: true, stdio: 'ignore' }).unref()
  } else {
    spawn('xdg-open', [URL], { detached: true, stdio: 'ignore' }).unref()
  }
}

const child = spawn('npx', ['next', 'dev', '--webpack'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
})

let opened = false

async function waitAndOpen() {
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 500))
    try {
      const res = await fetch(URL, { redirect: 'manual' })
      if (res.ok || res.status === 304 || res.status === 307 || res.status === 308) {
        if (!opened) {
          opened = true
          openBrowser()
        }
        return
      }
    } catch {
      /* ainda não subiu */
    }
  }
}

waitAndOpen().catch(() => {})

child.on('exit', (code) => process.exit(code ?? 0))
