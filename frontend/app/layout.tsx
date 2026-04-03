import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import Layout from '@/components/Layout'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SuperApp — Chat, Rides, Food & More',
  description: 'The ultimate everything app — WhatsApp + Uber + Zomato + OLX in one unified platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SuperApp',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ServiceWorkerRegistrar />
        <ConvexClientProvider>
          <Providers>
            <Layout>
              {children}
            </Layout>
          </Providers>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
