"use client"

import { cn } from "@/lib/utils"

interface VangoLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "full" | "icon" | "text"
  className?: string
}

export function VangoLogo({ size = "md", variant = "full", className }: VangoLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            "bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold",
            sizeClasses[size],
            size === "sm" ? "w-6" : size === "md" ? "w-8" : size === "lg" ? "w-12" : "w-16",
            textSizeClasses[size],
          )}
        >
          V
        </div>
      </div>
    )
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold text-orange-500", textSizeClasses[size], className)}>
        Van<span className="text-orange-600">Go</span>
      </span>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold",
          sizeClasses[size],
          size === "sm" ? "w-6" : size === "md" ? "w-8" : size === "lg" ? "w-12" : "w-16",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : size === "lg" ? "text-lg" : "text-xl",
        )}
      >
        V
      </div>
      <span className={cn("font-bold text-orange-500", textSizeClasses[size])}>
        Van<span className="text-orange-600">Go</span>
      </span>
    </div>
  )
}
