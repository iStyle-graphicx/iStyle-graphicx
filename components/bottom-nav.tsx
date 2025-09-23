"use client"

import { Home, MapPin, Truck, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomNavProps {
  currentSection: string
  onNavigate: (section: string) => void
  onRequestDelivery: () => void
}

export function BottomNav({ currentSection, onNavigate, onRequestDelivery }: BottomNavProps) {
  const navItems = [
    { id: "homeSection", label: "Home", icon: Home },
    { id: "trackDeliverySection", label: "Track", icon: MapPin },
    { id: "request", label: "Request", icon: Truck, action: onRequestDelivery },
    { id: "driversSection", label: "Drivers", icon: Users },
    { id: "profileSection", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black/90 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-2 z-30">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentSection === item.id

        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 py-2 px-3 transition-all duration-200 ${
              isActive ? "text-orange-500 transform -translate-y-1" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => (item.action ? item.action() : onNavigate(item.id))}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        )
      })}
    </nav>
  )
}
