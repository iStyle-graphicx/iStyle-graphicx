import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { OfflineIndicator } from "@/components/offline-indicator"
import { FullScreenLoading } from "@/components/loading-fallback"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "VanGo - Premium Hardware Material Delivery",
  description:
    "VanGo connects you with reliable drivers for seamless transportation of your hardware materials. From cement to metal sheets, we've got your delivery needs covered.",
  generator: "VanGo Delivery App v1.1.0",
  keywords: "VanGo, delivery, hardware materials, transportation, South Africa, Pretoria, drivers, logistics",
  authors: [{ name: "VanGo Delivery (PTY) Ltd." }],
  creator: "VanGo Delivery (PTY) Ltd.",
  publisher: "VanGo Delivery (PTY) Ltd.",
  robots: "index, follow",
  openGraph: {
    title: "VanGo - Premium Hardware Material Delivery",
    description: "Reliable drivers for seamless transportation of your hardware materials",
    type: "website",
    locale: "en_ZA",
    siteName: "VanGo",
  },
  twitter: {
    card: "summary_large_image",
    title: "VanGo - Premium Hardware Material Delivery",
    description: "Reliable drivers for seamless transportation of your hardware materials",
  },
  applicationName: "VanGo Delivery",
  category: "business",
  classification: "Delivery & Logistics",
  other: {
    company: "VanGo Delivery (PTY) Ltd.",
    version: "1.1.0",
    copyright: "© 2025 VanGo Delivery (PTY) Ltd. All rights reserved.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased dark`}>
      <head>
        <link rel="icon" type="image/jpeg" href="/vango-logo.jpg" />
        <link rel="apple-touch-icon" href="/vango-logo.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="application-name" content="VanGo Delivery" />
        <meta name="apple-mobile-web-app-title" content="VanGo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        <link rel="preload" href="/vango-logo.jpg" as="image" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body className="font-sans">
        <ErrorBoundary>
          <Suspense fallback={<FullScreenLoading />}>{children}</Suspense>
          <OfflineIndicator />
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  )
}
