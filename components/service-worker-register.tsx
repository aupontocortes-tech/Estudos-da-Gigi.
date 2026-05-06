'use client'

import { useEffect } from 'react'
import { isLoopbackHost, isPrivateLanHost, normalizeHostname } from '@/lib/pwa-env'

function shouldRegisterServiceWorker(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  const host = normalizeHostname(window.location.hostname)
  const loopback = isLoopbackHost(host)
  // HTTP em IP da rede não é contexto seguro: Chrome não registra SW (use npm run dev:https).
  if (!window.isSecureContext && !loopback) return false
  if (process.env.NODE_ENV === 'production') return true
  return loopback || isPrivateLanHost(host)
}

/** Registra /sw.js — obrigatório para PWA / beforeinstallprompt no Chrome. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await reg.update()
        await navigator.serviceWorker.ready
      } catch (e) {
        console.warn('[PWA] Falha ao registrar service worker:', e)
      }
    }

    if (document.readyState === 'complete') {
      void register()
    } else {
      window.addEventListener('load', () => void register(), { once: true })
    }
  }, [])

  return null
}
