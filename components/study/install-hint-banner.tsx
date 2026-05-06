"use client"

import { useEffect, useState } from "react"
import { X, Monitor, Smartphone, Download } from "lucide-react"
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install-prompt"
import { isPrivateLanHost, normalizeHostname } from "@/lib/pwa-env"

const STORAGE_KEY = "estudos-gigi-install-hint-dismissed"

type Platform = "android" | "ios" | "desktop"

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop"
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (isIOS) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "desktop"
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

const hints: Record<
  Platform,
  {
    headline: string
    title: string
    subtitle: string
    steps: string
    Icon: typeof Smartphone
  }
> = {
  android: {
    headline: "Instalar no Android",
    title: "Celular ou tablet Android",
    subtitle: "Use o Google Chrome (cole o link na barra de endereço)",
    steps:
      "Se aparecer o botão **Instalar aplicativo** abaixo, toque nele e confirme. Se não aparecer: menu **⋮** → **Instalar app** ou **Adicionar à tela inicial**.",
    Icon: Smartphone,
  },
  ios: {
    headline: "Instalar no iPhone ou iPad",
    title: "iPhone e iPad",
    subtitle: "Só no Safari — não no Chrome embutido nem dentro do WhatsApp",
    steps:
      "**Cole o link** deste site na barra do **Safari** (ou **Abrir no Safari**). Depois: **Compartilhar** (□↑) → **Adicionar à Tela de Início** → **Adicionar**.",
    Icon: Smartphone,
  },
  desktop: {
    headline: "Instalar no computador",
    title: "Windows, Mac ou Linux",
    subtitle: "Chrome, Edge ou Brave",
    steps:
      "Use o botão **Instalar** quando aparecer, ou o ícone na barra de endereços, ou menu **⋮** → **Instalar como aplicativo**.",
    Icon: Monitor,
  },
}

function formatSteps(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export function InstallHintBanner() {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [platform, setPlatform] = useState<Platform>("desktop")
  const [standalone, setStandalone] = useState(false)
  const [devNeedsHttps, setDevNeedsHttps] = useState(false)
  const { canPromptInstall, promptInstall, installed } = usePwaInstallPrompt()

  useEffect(() => {
    setPlatform(detectPlatform())
    setStandalone(isStandaloneDisplay())
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1")
    if (process.env.NODE_ENV === "development") {
      const h = normalizeHostname(window.location.hostname)
      if (!window.isSecureContext && isPrivateLanHost(h)) setDevNeedsHttps(true)
    }
    setReady(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setDismissed(true)
  }

  if (!ready || dismissed || standalone || installed) return null

  const hint = hints[platform]
  const { headline, title, subtitle, steps, Icon } = hint
  const showInstallButton = platform !== "ios" && canPromptInstall

  return (
    <section
      className="mx-4 mb-3 rounded-2xl border border-border bg-card p-4 card-shadow"
      aria-label="Como instalar o aplicativo"
    >
      {devNeedsHttps && (
        <p className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-foreground">
          <strong className="font-semibold">Modo dev na rede (HTTP):</strong> o Chrome não instala PWA assim. Pare o
          servidor e rode <code className="rounded bg-background/80 px-1">npm run dev:https</code>, depois abra o{" "}
          <strong>https://</strong>
          com o IP do seu PC (aceite o aviso do certificado).
        </p>
      )}

      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">{headline}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            É o mesmo site no navegador — depois de instalar, abre como aplicativo.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Fechar dica de instalação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showInstallButton && (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.99]"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Instalar aplicativo
        </button>
      )}

      <div className="flex gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 ring-1 ring-primary/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
              este dispositivo
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{formatSteps(steps)}</p>
        </div>
      </div>
    </section>
  )
}
