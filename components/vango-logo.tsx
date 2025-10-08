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
        <img src="/images/vango-logo-new.svg" alt="Vango" className={cn(sizeClasses[size], "w-auto")} />
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
    <div className={cn("flex items-center", className)}>
      <img src="/images/vango-logo-new.svg" alt="Vango" className={cn(sizeClasses[size], "w-auto")} />
    </div>
  )
}
