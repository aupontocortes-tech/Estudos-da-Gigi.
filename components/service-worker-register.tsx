'use client'

import { useEffect } from 'react'

/** Registra o SW em produção (HTTPS). Sem isso, Android/Chrome não oferecem “Instalar app”. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (e) {
        console.warn('[PWA] Falha ao registrar service worker:', e)
      }
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
