'use client'

import { useEffect } from 'react'

function shouldRegisterServiceWorker(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  const { hostname } = window.location
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  if (!window.isSecureContext && !isLocal) return false
  // Produção (Vercel) ou localhost: necessário para PWA / beforeinstallprompt no Chrome
  return process.env.NODE_ENV === 'production' || isLocal
}

/** Registra /sw.js — obrigatório para o Chrome Android tratar o site como PWA instalável. */
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
