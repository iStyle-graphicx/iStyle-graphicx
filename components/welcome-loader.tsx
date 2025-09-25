"use client"

import { useState, useEffect } from "react"
import { VangoLogo } from "@/components/vango-logo"

export function WelcomeLoader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 animate-vango-fade-in">
        <div className="animate-vango-pulse">
          <VangoLogo size="xl" variant="full" className="justify-center" />
        </div>

        <div className="space-y-4">
          <p className="text-white/80 text-lg">Premium Hardware Material Delivery</p>

          {/* Enhanced progress bar with Vango branding */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-orange-400 text-sm mt-2 font-medium">{progress}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
