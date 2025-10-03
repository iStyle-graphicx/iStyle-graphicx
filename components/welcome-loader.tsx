"use client"

import { useState, useEffect } from "react"
import { VangoLogo } from "@/components/vango-logo"
import { Truck, Package, MapPin } from "lucide-react"

export function WelcomeLoader() {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)

  const loadingTips = [
    { icon: Truck, text: "Connecting you with reliable drivers..." },
    { icon: Package, text: "Preparing your delivery experience..." },
    { icon: MapPin, text: "Loading delivery areas..." },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setIsComplete(true)
          return 100
        }
        return prev + 2
      })
    }, 25)

    const tipTimer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % loadingTips.length)
    }, 2000)

    return () => {
      clearInterval(timer)
      clearInterval(tipTimer)
    }
  }, [])

  const CurrentIcon = loadingTips[currentTip].icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 animate-vango-fade-in px-4">
        <div className={isComplete ? "animate-vango-bounce" : "animate-vango-pulse"}>
          <VangoLogo size="xl" variant="full" className="justify-center" />
        </div>

        <div className="space-y-4">
          <p className="text-white/80 text-lg">Premium Hardware Material Delivery</p>

          {/* Enhanced progress bar with Vango branding */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-orange-400 text-sm mt-2 font-medium">{isComplete ? "Ready!" : `${progress}%`}</p>
          </div>

          {/* Loading tip with icon */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm min-h-[24px]">
            <CurrentIcon className="w-4 h-4 animate-pulse" />
            <span className="animate-fade-in">{loadingTips[currentTip].text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
