import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Abreise — Haus Döschnitz',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={jetbrainsMono.variable}>
      <body className="font-mono bg-white text-black antialiased">
        <main className="max-w-md mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
