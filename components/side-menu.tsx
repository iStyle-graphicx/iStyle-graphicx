"use client"

import {
  X,
  Home,
  User,
  MapPin,
  History,
  Truck,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  Bell,
  BookOpen,
  ScrollText,
  Shield,
  Copyright,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  currentSection: string
  onNavigate: (section: string) => void
  user: any
  onLogout: () => void
}

export function SideMenu({ isOpen, onClose, currentSection, onNavigate, user, onLogout }: SideMenuProps) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user?.id) {
      checkAdminStatus()
    }
  }, [user])

  const checkAdminStatus = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("admin_roles").select("role").eq("user_id", user.id).single()

    setIsAdmin(!!data)
  }

  const menuItems = [
    { id: "homeSection", label: "Home", icon: Home },
    { id: "profileSection", label: "Profile", icon: User },
    { id: "trackDeliverySection", label: "Track Delivery", icon: MapPin },
    { id: "deliveryHistorySection", label: "Delivery History", icon: History },
    { id: "driversPortalSection", label: "Drivers Portal", icon: Truck },
    { id: "notificationsSection", label: "Notifications", icon: Bell },
    ...(isAdmin ? [{ id: "adminDashboard", label: "Admin Dashboard", icon: ShieldCheck }] : []),
    { id: "servicesSection", label: "Services", icon: Settings },
    { id: "deliveryAreasSection", label: "Delivery Areas", icon: MapPin },
    { id: "learnMoreSection", label: "Learn More", icon: BookOpen },
    { id: "settingsSection", label: "Settings", icon: Settings },
    { id: "helpSupportSection", label: "Help & Support", icon: HelpCircle },
    { id: "termsSection", label: "Terms of Service", icon: ScrollText },
    { id: "privacySection", label: "Privacy Policy", icon: Shield },
    { id: "copyrightSection", label: "Copyright Policy", icon: Copyright },
  ]

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId)
    onClose()
  }

  return (
    <div
      className={`fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-md border-r border-white/10 transform transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-orange-500 font-bold text-lg">Menu</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">{user?.name || "Guest User"}</p>
            <p className="text-xs text-gray-400">{user?.userType || "Not logged in"}</p>
            {isAdmin && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Admin</span>}
          </div>
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-yellow-400">🌤️</span> Pretoria, 25°C
        </div>
      </div>

      <nav className="flex flex-col p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`justify-start text-left py-3 px-4 ${
                currentSection === item.id ? "bg-orange-500/20 text-orange-500" : "text-gray-300 hover:text-white"
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          )
        })}

        <hr className="border-white/10 my-4" />

        {user ? (
          <Button
            variant="ghost"
            className="justify-start text-left py-3 px-4 text-red-500 hover:text-red-400"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        ) : (
          <Button variant="ghost" className="justify-start text-left py-3 px-4 text-orange-500 hover:text-orange-400">
            <LogIn className="w-5 h-5 mr-3" />
            Login / Register
          </Button>
        )}
      </nav>
    </div>
  )
}
