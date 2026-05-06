"use client"

import { useEffect, useState } from "react"
import { X, Monitor, Smartphone, Download, Link2, Check } from "lucide-react"
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install-prompt"
import { isPrivateLanHost, normalizeHostname } from "@/lib/pwa-env"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    badge: string
    title: string
    subtitle: string
    steps: string
    Icon: typeof Smartphone
  }
> = {
  android: {
    headline: "Baixar o aplicativo",
    badge: "Android",
    title: "Google Chrome no celular ou tablet",
    subtitle: "Cole o link na barra de endereços do Chrome e use o botão abaixo quando aparecer.",
    steps:
      "Toque em **Instalar aplicativo** para adicionar à tela inicial. Se o botão não aparecer: menu **⋮** (canto superior) → **Instalar app** ou **Adicionar à tela inicial** → confirme.",
    Icon: Smartphone,
  },
  ios: {
    headline: "Baixar o aplicativo",
    badge: "iPhone e iPad",
    title: "Safari (navegador da Apple)",
    subtitle: "No iPhone não há botão de instalar como no Android — você cola o link no Safari e adiciona à tela inicial.",
    steps:
      "**Copie o link** com o botão abaixo. Abra o **Safari**, cole na barra de endereços e carregue o site. Depois toque em **Compartilhar** (□↑) → **Adicionar à Tela de Início** → **Adicionar**. Não use o Chrome embutido no WhatsApp para este passo.",
    Icon: Smartphone,
  },
  desktop: {
    headline: "Baixar o aplicativo",
    badge: "Computador",
    title: "Chrome, Edge ou Brave",
    subtitle: "O site vira um aplicativo na área de trabalho — mesmo em Windows, Mac ou Linux.",
    steps:
      "Use **Instalar aplicativo** quando o botão estiver disponível. Ou clique no ícone de instalar na barra de endereços (⊕), ou menu **⋮** → **Instalar Estudos da Gigi** / **Instalar como aplicativo**.",
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
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
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
    setOpen(false)
  }

  const shouldShow = ready && !dismissed && !standalone && !installed

  useEffect(() => {
    if (shouldShow) setOpen(true)
    else setOpen(false)
  }, [shouldShow])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) dismiss()
  }

  const copySiteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard não disponível */
    }
  }

  if (!ready || dismissed || standalone || installed) return null

  const hint = hints[platform]
  const { headline, badge, title, subtitle, steps, Icon } = hint
  const showChromeInstallButton = platform !== "ios" && canPromptInstall

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[min(560px,88vh)] gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 card-shadow",
          "w-[min(100vw-1.5rem,26rem)] sm:max-w-md",
        )}
      >
        <div className="relative border-b border-border bg-primary/5 px-5 pb-4 pt-5">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <span className="inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {badge}
              </span>
              <DialogTitle className="mt-2 text-left text-lg font-bold leading-tight text-foreground">
                {headline}
              </DialogTitle>
              <DialogDescription className="mt-1 text-left text-sm font-medium text-muted-foreground">
                {title}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {devNeedsHttps && (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-snug text-foreground">
              <strong className="font-semibold">Modo dev na rede (HTTP):</strong> o Chrome não instala PWA assim. Rode{" "}
              <code className="rounded bg-background/80 px-1">npm run dev:https</code> e abra o endereço com{" "}
              <strong>https://</strong> (aceite o certificado).
            </p>
          )}

          <p className="text-sm text-foreground/95">{subtitle}</p>

          <div className="rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 text-xs leading-relaxed text-foreground/90">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-primary">
              Como baixar / instalar
            </span>
            <p>{formatSteps(steps)}</p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border bg-secondary/20 px-5 py-4 sm:flex-col">
          {showChromeInstallButton && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.99]"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Instalar aplicativo
            </button>
          )}

          {platform === "ios" && (
            <button
              type="button"
              onClick={() => void copySiteLink()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.99]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  Link copiado
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 shrink-0" aria-hidden />
                  Copiar link do site
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-full rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Agora não
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
