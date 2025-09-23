"use client"

import { useState, useEffect } from "react"
import { WelcomeLoader } from "@/components/welcome-loader"
import { HomeStart } from "@/components/home-start"
import { MainApp } from "@/components/main-app"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { ToastProvider } from "@/components/toast-provider"

function AppContent() {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  if (isLoading || authLoading) {
    return <WelcomeLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {!isAuthenticated ? <HomeStart onAuthenticated={() => {}} /> : <MainApp onLogout={() => {}} />}
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
