import type { Metadata } from 'next'
import { Geist, Zen_Dots } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const zenDots = Zen_Dots({
  variable: '--font-zen-dots',
  weight: ['400'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Open Deep Research',
  description:
    'Open source alternative to Deep Research. Generate reports with AI based on search results.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <Analytics />
      <body className={`${geistSans.variable} ${zenDots.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
