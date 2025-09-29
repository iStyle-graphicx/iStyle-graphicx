"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileOptimizationsProps {
  children: React.ReactNode
}

export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const isMobile = useIsMobile()
  const [isStandalone, setIsStandalone] = useState(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

  useEffect(() => {
    // Check if app is running as PWA
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)

    // Handle orientation changes
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape")
    }

    handleOrientationChange()
    window.addEventListener("resize", handleOrientationChange)
    window.addEventListener("orientationchange", handleOrientationChange)

    // Prevent zoom on double tap for iOS
    if (isMobile) {
      let lastTouchEnd = 0
      const preventZoom = (e: TouchEvent) => {
        const now = Date.now()
        if (now - lastTouchEnd <= 300) {
          e.preventDefault()
        }
        lastTouchEnd = now
      }

      document.addEventListener("touchend", preventZoom, { passive: false })

      return () => {
        window.removeEventListener("resize", handleOrientationChange)
        window.removeEventListener("orientationchange", handleOrientationChange)
        document.removeEventListener("touchend", preventZoom)
      }
    }

    return () => {
      window.removeEventListener("resize", handleOrientationChange)
      window.removeEventListener("orientationchange", handleOrientationChange)
    }
  }, [isMobile])

  // Add mobile-specific classes
  const mobileClasses = isMobile
    ? [
        "touch-manipulation", // Optimize touch interactions
        "select-none", // Prevent text selection on mobile
        orientation === "landscape" ? "landscape-mode" : "portrait-mode",
        isStandalone ? "pwa-mode" : "browser-mode",
      ].join(" ")
    : ""

  return (
    <div className={mobileClasses}>
      {children}

      {/* Mobile-specific styles */}
      <style jsx global>{`
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        .landscape-mode {
          /* Adjust layout for landscape */
        }
        
        .portrait-mode {
          /* Optimize for portrait */
        }
        
        .pwa-mode {
          /* PWA-specific adjustments */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        /* Improve touch targets */
        @media (max-width: 768px) {
          button, a, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimize form inputs for mobile */
          input, textarea, select {
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          /* Improve scrolling performance */
          * {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  )
}
