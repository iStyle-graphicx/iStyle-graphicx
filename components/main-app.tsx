"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SideMenu } from "@/components/side-menu"
import { BottomNav } from "@/components/bottom-nav"
import { HomeSection } from "@/components/sections/home-section"
import { ProfileSection } from "@/components/sections/profile-section"
import { TrackSection } from "@/components/sections/track-section"
import { DriversSection } from "@/components/sections/drivers-section"
import { DeliveryHistorySection } from "@/components/sections/delivery-history-section"
import { DriversPortalSection } from "@/components/sections/drivers-portal-section"
import { ServicesSection } from "@/components/sections/services-section"
import { DeliveryAreasSection } from "@/components/sections/delivery-areas-section"
import { SettingsSection } from "@/components/sections/settings-section"
import { HelpSupportSection } from "@/components/sections/help-support-section"
import { NotificationsSection } from "@/components/sections/notifications-section"
import { LearnMoreSection } from "@/components/sections/learn-more-section"
import { RequestDeliveryModal } from "@/components/request-delivery-modal"

interface MainAppProps {
  onLogout: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [currentSection, setCurrentSection] = useState("homeSection")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("vangoUser")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("vangoUser")
    setCurrentUser(null)
    onLogout()
  }

  const handleLearnMore = () => {
    setCurrentSection("learnMoreSection")
  }

  const handleRequestDriver = (driver: any) => {
    setShowRequestModal(true)
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "homeSection":
        return <HomeSection onRequestDelivery={() => setShowRequestModal(true)} onLearnMore={handleLearnMore} />
      case "profileSection":
        return <ProfileSection user={currentUser} onLogout={handleLogout} />
      case "trackDeliverySection":
        return <TrackSection user={currentUser} />
      case "deliveryHistorySection":
        return <DeliveryHistorySection />
      case "driversPortalSection":
        return <DriversPortalSection user={currentUser} />
      case "driversSection":
        return <DriversSection user={currentUser} onRequestDriver={handleRequestDriver} />
      case "servicesSection":
        return <ServicesSection />
      case "deliveryAreasSection":
        return <DeliveryAreasSection />
      case "settingsSection":
        return <SettingsSection user={currentUser} />
      case "helpSupportSection":
        return <HelpSupportSection />
      case "notificationsSection":
        return <NotificationsSection user={currentUser} />
      case "learnMoreSection":
        return <LearnMoreSection />
      default:
        return <HomeSection onRequestDelivery={() => setShowRequestModal(true)} onLearnMore={handleLearnMore} />
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
      <Header onMenuToggle={() => setIsMenuOpen(true)} user={currentUser} />

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="pb-20 pt-4">{renderCurrentSection()}</main>

      <BottomNav
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        onRequestDelivery={() => setShowRequestModal(true)}
      />

      <RequestDeliveryModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />

      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />}
    </div>
  )
}
