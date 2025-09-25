import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "VanGo - Premium Hardware Material Delivery",
  description:
    "VanGo connects you with reliable drivers for seamless transportation of your hardware materials. From cement to metal sheets, we've got your delivery needs covered.",
  generator: "VanGo Delivery App",
  keywords: "VanGo, delivery, hardware materials, transportation, South Africa, Pretoria, drivers",
  authors: [{ name: "VanGo Team" }],
  creator: "VanGo",
  publisher: "VanGo",
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
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#f97316",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased dark`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/vango-favicon.jpg" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
      </head>
      <body className="font-sans">
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
