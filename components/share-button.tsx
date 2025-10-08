"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useSettings } from "@/lib/contexts/settings-context"

interface ShareButtonProps {
  title?: string
  text?: string
  url?: string
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function ShareButton({
  title = "VanGo Delivery",
  text = "Check out VanGo - Premium Hardware Material Delivery Service!",
  url,
  className = "",
  size = "default",
  variant = "default",
}: ShareButtonProps) {
  const { shareApp } = useSettings()

  const handleShare = () => {
    const shareUrl = url || window.location.origin
    const shareText = `${text} ${shareUrl}`

    if (navigator.share) {
      navigator.share({
        title,
        text,
        url: shareUrl,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareText).then(() => {
        // Toast notification handled by settings context
      })
    }
  }

  return (
    <Button onClick={handleShare} variant={variant} size={size} className={className}>
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  )
}
