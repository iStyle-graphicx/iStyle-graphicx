"use client"

import { Loader2, Truck } from "lucide-react"

interface LoadingFallbackProps {
  message?: string
  size?: "sm" | "md" | "lg"
  showLogo?: boolean
}

export function LoadingFallback({ message = "Loading...", size = "md", showLogo = true }: LoadingFallbackProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const containerClasses = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {showLogo && (
        <div className="mb-4 p-3 bg-orange-500/20 rounded-full">
          <Truck className="w-8 h-8 text-orange-500" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
        <span className="text-white font-medium">{message}</span>
      </div>

      <div className="mt-4 flex space-x-1">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

export function FullScreenLoading({ message = "Loading VanGo..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <LoadingFallback message={message} size="lg" />
    </div>
  )
}

export function SectionLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingFallback message={message} size="md" showLogo={false} />
    </div>
  )
}
