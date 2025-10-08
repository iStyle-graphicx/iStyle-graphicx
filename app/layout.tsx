import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import LoadingWrapper from "./loading-wrapper"

export const metadata: Metadata = {
  title: "VANGO - Fast Delivery Service",
  description: "Fast, reliable delivery service connecting customers with professional drivers",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.jpg", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VANGO",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "VANGO",
    title: "VANGO - Fast Delivery Service",
    description: "Fast, reliable delivery service connecting customers with professional drivers",
  },
  twitter: {
    card: "summary",
    title: "VANGO - Fast Delivery Service",
    description: "Fast, reliable delivery service connecting customers with professional drivers",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <LoadingWrapper>{children}</LoadingWrapper>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
