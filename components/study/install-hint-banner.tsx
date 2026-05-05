"use client"

import { useEffect, useState } from "react"
import { X, Monitor, Smartphone } from "lucide-react"

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
    subtitle: "Chrome ou navegador recomendado pelo fabricante",
    steps:
      "Com o site aberto aqui, toque no menu **⋮** → **Instalar app** ou **Adicionar à tela inicial** e confirme. O ícone do Estudos da Gigi fica na área de trabalho do celular, como um app.",
    Icon: Smartphone,
  },
  ios: {
    headline: "Instalar no iPhone ou iPad",
    title: "iPhone e iPad",
    subtitle: "Só funciona no Safari — não no Chrome nem no app do WhatsApp",
    steps:
      "Se você abriu por outro lugar, **cole o link deste site na barra do Safari** ou use **Abrir no Safari**. Depois toque em **Compartilhar** (□↑) → **Adicionar à Tela de Início** → **Adicionar**.",
    Icon: Smartphone,
  },
  desktop: {
    headline: "Instalar no computador",
    title: "Windows, Mac ou Linux",
    subtitle: "Chrome, Edge ou Brave",
    steps:
      "Na barra de endereços, use o ícone de **instalar** (⊕ ou monitor com seta), ou o menu **⋮** → **Instalar Estudos da Gigi** / **Instalar como aplicativo** → **Instalar**.",
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

  useEffect(() => {
    setPlatform(detectPlatform())
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1")
    setReady(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setDismissed(true)
  }

  if (!ready || dismissed) return null

  const hint = hints[platform]
  const { headline, title, subtitle, steps, Icon } = hint

  return (
    <section
      className="mx-4 mb-3 rounded-2xl border border-border bg-card p-4 card-shadow"
      aria-label="Como instalar o aplicativo"
    >
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
