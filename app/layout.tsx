import type { Metadata, Viewport } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: '--font-sans',
  weight: ['400', '600', '700', '800']
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Estudos da Gigi',
  description: 'Aplicativo de estudos com timer, graficos e anotacoes',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Estudos da Gigi',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#FF5BA8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${nunito.variable} ${quicksand.variable} font-sans antialiased`}>
        <Script id="eg-pwa-install-capture" strategy="beforeInteractive">
          {`
try {
  window.__EG_PWA_DEFERRED_PROMPT = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__EG_PWA_DEFERRED_PROMPT = e;
  });
  window.addEventListener('appinstalled', function () {
    window.__EG_PWA_DEFERRED_PROMPT = null;
  });
} catch (_) {}
          `.trim()}
        </Script>
        <ServiceWorkerRegister />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
