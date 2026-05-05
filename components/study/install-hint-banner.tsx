"use client"

import { useEffect, useState } from "react"
import { X, Monitor, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

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

const hints: {
  id: Platform
  title: string
  subtitle: string
  steps: string
  Icon: typeof Smartphone
}[] = [
  {
    id: "android",
    title: "Android",
    subtitle: "Chrome ou navegador recomendado",
    steps:
      "Toque no menu ⋮ → **Instalar app** ou **Adicionar à tela inicial**. Confirme para criar o atalho na área de trabalho do celular.",
    Icon: Smartphone,
  },
  {
    id: "ios",
    title: "iPhone e iPad",
    subtitle: "Use o Safari",
    steps:
      "Toque em **Compartilhar** (□↑) → **Adicionar à Tela de Início** → **Adicionar**. O app abre como atalho em tela cheia.",
    Icon: Smartphone,
  },
  {
    id: "desktop",
    title: "Computador (PC)",
    subtitle: "Chrome, Edge ou Brave",
    steps:
      "Procure o ícone de **instalar** (⊕ ou monitor com seta) na barra de endereços, ou menu **⋮** → **Instalar Estudos da Gigi** / **Aplicativo** → **Instalar**.",
    Icon: Monitor,
  },
]

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

  return (
    <section
      className="mx-4 mb-3 rounded-2xl border border-border bg-card p-4 card-shadow"
      aria-label="Como instalar o aplicativo"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Instale o app no seu dispositivo</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mesmo site — vira atalho como aplicativo. Escolha o seu sistema:
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

      <ul className="space-y-2.5">
        {hints.map(({ id, title, subtitle, steps, Icon }) => {
          const isHere = platform === id
          return (
            <li
              key={id}
              className={cn(
                "flex gap-3 rounded-xl border border-border/80 bg-background/60 p-3 transition-colors",
                isHere && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary",
                  isHere && "bg-primary/15 text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                  {isHere && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      seu dispositivo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
                  {formatSteps(steps)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
