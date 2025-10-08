"use client"

import { useEffect, useState } from "react"
import { Truck } from "lucide-react"

interface AppLoaderProps {
  onLoadComplete?: () => void
}

export default function AppLoader({ onLoadComplete }: AppLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsComplete(true)
            onLoadComplete?.()
          }, 300) // Small delay for smooth transition
          return 100
        }
        // Faster progress at the start, slower near the end
        const increment = prev < 50 ? 8 : prev < 80 ? 5 : 3
        return Math.min(prev + increment, 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onLoadComplete])

  if (isComplete) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-8">
        {/* Logo Animation */}
        <div className="relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Truck className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>

        {/* Brand Name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">VANGO</h1>
          <p className="text-sm text-muted-foreground">Fast & Reliable Delivery</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-center text-sm text-muted-foreground">{progress}%</p>
        </div>
      </div>
    </div>
  )
}
