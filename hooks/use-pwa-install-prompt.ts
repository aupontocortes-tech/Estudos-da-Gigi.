'use client'

import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  preventDefault: () => void
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    /** Preenchido por script inline no layout antes da hidratação. */
    __EG_PWA_DEFERRED_PROMPT?: BeforeInstallPromptEvent | null
  }
}

export function usePwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const queued = typeof window !== 'undefined' ? window.__EG_PWA_DEFERRED_PROMPT : null
    if (queued) {
      setDeferred(queued)
      window.__EG_PWA_DEFERRED_PROMPT = null
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      if (typeof window !== 'undefined') window.__EG_PWA_DEFERRED_PROMPT = null
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return { ok: false as const, reason: 'no-prompt' as const }
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      setDeferred(null)
      return { ok: choice.outcome === 'accepted', reason: choice.outcome }
    } catch {
      setDeferred(null)
      return { ok: false as const, reason: 'error' as const }
    }
  }, [deferred])

  return {
    canPromptInstall: deferred !== null && !installed,
    promptInstall,
    installed,
  }
}
