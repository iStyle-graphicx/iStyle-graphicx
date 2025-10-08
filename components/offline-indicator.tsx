"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(false)
      toast({
        title: "Connection restored",
        description: "You're back online!",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
      toast({
        title: "Connection lost",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
      })
    }

    // Set initial state
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  if (!showIndicator) return null

  return (
    <div className="fixed top-16 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </div>
  )
}
