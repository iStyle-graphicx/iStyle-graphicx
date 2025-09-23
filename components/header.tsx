"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onMenuToggle: () => void
  user: any
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
      <h1 className="text-orange-500 font-bold text-xl">VanGo</h1>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-yellow-400">☀️</span>
          <span>25°C</span>
        </div>

        <Button variant="ghost" size="sm" className="relative text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onMenuToggle} className="text-white">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  )
}
