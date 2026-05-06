import type { Metadata, Viewport } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFF8FC',
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
        <ServiceWorkerRegister />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
