"use client"

import { useState, useEffect } from "react"
import { WelcomeLoader } from "@/components/welcome-loader"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { UserTypeSelector } from "@/components/onboarding/user-type-selector"
import { FeatureTour } from "@/components/onboarding/feature-tour"
import { HomeStart } from "@/components/home-start"
import { MainApp } from "@/components/main-app"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { ToastProvider } from "@/components/toast-provider"

function AppContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [loaderComplete, setLoaderComplete] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(false)
  const [showFeatureTour, setShowFeatureTour] = useState(false)
  const [userType, setUserType] = useState<"customer" | "driver" | null>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem("vangoOnboardingComplete")
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
      setIsLoading(false)
    }
  }, [authLoading])

  const handleLoaderComplete = () => {
    setLoaderComplete(true)
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem("vangoOnboardingComplete", "true")

    // Show user type selector if not authenticated
    if (!isAuthenticated) {
      setShowUserTypeSelector(true)
    }
  }

  const handleUserTypeSelect = (selectedUserType: "customer" | "driver") => {
    setUserType(selectedUserType)
    setShowUserTypeSelector(false)
    localStorage.setItem("vangoUserType", selectedUserType)
  }

  const handleUserTypeSkip = () => {
    setShowUserTypeSelector(false)
  }

  const handleAuthenticated = () => {
    // Show feature tour for first-time authenticated users
    const hasSeenTour = localStorage.getItem("vangoFeatureTourComplete")
    if (!hasSeenTour) {
      setTimeout(() => setShowFeatureTour(true), 1000)
    }
  }

  const handleTourComplete = () => {
    setShowFeatureTour(false)
    localStorage.setItem("vangoFeatureTourComplete", "true")
  }

  // Feature tour steps
  const tourSteps = [
    {
      id: "home",
      title: "Welcome to your Dashboard",
      description: "This is your main dashboard where you can see all your delivery options and quick actions.",
      target: "[data-tour='home-section']",
      position: "bottom" as const,
      highlight: true,
    },
    {
      id: "request-delivery",
      title: "Request a Delivery",
      description: "Tap here to quickly request a new delivery. You'll be guided through the process step by step.",
      target: "[data-tour='request-delivery']",
      position: "top" as const,
      highlight: true,
    },
    {
      id: "bottom-nav",
      title: "Navigate the App",
      description: "Use the bottom navigation to access different sections like tracking, profile, and more.",
      target: "[data-tour='bottom-nav']",
      position: "top" as const,
      highlight: true,
    },
    {
      id: "menu",
      title: "Access More Features",
      description: "Tap the menu icon to access additional features like settings, help, and your delivery history.",
      target: "[data-tour='menu-button']",
      position: "bottom" as const,
      highlight: true,
    },
  ]

  if (authLoading || (isLoading && !loaderComplete)) {
    return <WelcomeLoader onComplete={handleLoaderComplete} />
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} userType={userType} />
  }

  if (showUserTypeSelector) {
    return <UserTypeSelector onSelect={handleUserTypeSelect} onSkip={handleUserTypeSkip} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {!isAuthenticated ? <HomeStart onAuthenticated={handleAuthenticated} /> : <MainApp onLogout={() => {}} />}

      {showFeatureTour && (
        <FeatureTour
          isOpen={showFeatureTour}
          onClose={() => setShowFeatureTour(false)}
          onComplete={handleTourComplete}
          steps={tourSteps}
        />
      )}
    </div>
  )
}

export default function VanGoApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
