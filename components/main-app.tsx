"use client"

import { useState, useEffect } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { SectionLoading } from "@/components/loading-fallback"
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
import { LearnMoreSection } from "@/components/sections/learn-more-section"
import { TermsSection } from "@/components/sections/terms-section"
import { PrivacySection } from "@/components/sections/privacy-section"
import { CopyrightSection } from "@/components/sections/copyright-section"
import { RequestDeliveryModal } from "@/components/request-delivery-modal"
import { AuthModal } from "@/components/auth-modal"
import { DeliveryRequestModal } from "@/components/delivery-request-modal"
import { NotificationProvider } from "@/hooks/use-notifications"
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { PerformanceMonitor } from "@/lib/performance"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { SwipeGestures } from "@/components/mobile/swipe-gestures"
import { PullToRefresh } from "@/components/mobile/pull-to-refresh"
import { useHapticFeedback } from "@/components/mobile/haptic-feedback"
import { useIsMobile } from "@/hooks/use-mobile"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { useAuth } from "@/components/auth-provider"
import { NotificationsCenter } from "@/components/notifications-center"
import { DriverVerificationDashboard } from "@/components/admin/driver-verification-dashboard"
import { createClient } from "@/lib/supabase/client"

interface MainAppProps {
  onLogout: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [currentSection, setCurrentSection] = useState("homeSection")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authType, setAuthType] = useState<"login" | "register">("register")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const performanceMonitor = PerformanceMonitor.getInstance()
  const haptic = useHapticFeedback()
  const isMobile = useIsMobile()
  const { needsEmailVerification, user: authUser } = useAuth()

  useEffect(() => {
    performanceMonitor.startTiming("app-initialization")
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        localStorage.removeItem("vangoUser")
      }
    })

    performanceMonitor.endTiming("app-initialization")

    return () => {
      subscription.unsubscribe()
    }
  }, [performanceMonitor])

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (profile) {
        const userData = {
          id: userId,
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          userType: profile.user_type,
          avatarUrl: profile.avatar_url,
        }
        setCurrentUser(userData)
        localStorage.setItem("vangoUser", JSON.stringify(userData))
      }
    } catch (error) {
      console.error("[v0] Error fetching user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      checkAdminStatus(currentUser.id)
    }
  }, [currentUser])

  const checkAdminStatus = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("admin_roles").select("role").eq("user_id", userId).single()

    setIsAdmin(!!data)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem("vangoUser")
    setCurrentUser(null)
    setCurrentSection("homeSection")
    onLogout()
  }

  const handleLearnMore = () => {
    setCurrentSection("learnMoreSection")
  }

  const handleRequestDriver = (driver: any) => {
    setShowRequestModal(true)
  }

  const handleAuthSuccess = async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      await fetchUserProfile(session.user.id)
      setShowAuthModal(false)
      setCurrentSection("profileSection")
    }
  }

  const handleShowAuth = () => {
    setAuthType("register")
    setShowAuthModal(true)
  }

  const handleSectionChange = (section: string) => {
    performanceMonitor.startTiming(`section-change-${section}`)
    if (isMobile) {
      haptic.light()
    }
    setCurrentSection(section)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    haptic.medium()

    if (currentUser?.id) {
      await fetchUserProfile(currentUser.id)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsRefreshing(false)
    haptic.success()
  }

  const handleSwipeLeft = () => {
    if (isMenuOpen) return

    const sections = ["homeSection", "trackDeliverySection", "driversSection", "profileSection"]
    const currentIndex = sections.indexOf(currentSection)
    const nextIndex = (currentIndex + 1) % sections.length
    handleSectionChange(sections[nextIndex])
  }

  const handleSwipeRight = () => {
    if (isMenuOpen) return

    const sections = ["homeSection", "trackDeliverySection", "driversSection", "profileSection"]
    const currentIndex = sections.indexOf(currentSection)
    const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1
    handleSectionChange(sections[prevIndex])
  }

  const renderCurrentSection = () => {
    const sectionProps = {
      user: currentUser,
      onLogout: handleLogout,
      onRequestDriver: handleRequestDriver,
      onRequestDelivery: () => setShowRequestModal(true),
      onLearnMore: () => setCurrentSection("learnMoreSection"),
    }

    switch (currentSection) {
      case "homeSection":
        return (
          <ErrorBoundary>
            <HomeSection
              onRequestDelivery={() => setShowRequestModal(true)}
              onLearnMore={() => setCurrentSection("learnMoreSection")}
            />
          </ErrorBoundary>
        )
      case "profileSection":
        return (
          <ErrorBoundary>
            <ProfileSection
              user={currentUser}
              onLogout={handleLogout}
              onRefreshProfile={() => currentUser?.id && fetchUserProfile(currentUser.id)}
            />
          </ErrorBoundary>
        )
      case "trackDeliverySection":
        return (
          <ErrorBoundary>
            <TrackSection user={currentUser} />
          </ErrorBoundary>
        )
      case "deliveryHistorySection":
        return (
          <ErrorBoundary>
            <DeliveryHistorySection />
          </ErrorBoundary>
        )
      case "driversPortalSection":
        return (
          <ErrorBoundary>
            <DriversPortalSection user={currentUser} />
          </ErrorBoundary>
        )
      case "driversSection":
        return (
          <ErrorBoundary>
            <DriversSection user={currentUser} onRequestDriver={handleRequestDriver} />
          </ErrorBoundary>
        )
      case "servicesSection":
        return (
          <ErrorBoundary>
            <ServicesSection />
          </ErrorBoundary>
        )
      case "deliveryAreasSection":
        return (
          <ErrorBoundary>
            <DeliveryAreasSection />
          </ErrorBoundary>
        )
      case "settingsSection":
        return (
          <ErrorBoundary>
            <SettingsSection user={currentUser} />
          </ErrorBoundary>
        )
      case "helpSupportSection":
        return (
          <ErrorBoundary>
            <HelpSupportSection />
          </ErrorBoundary>
        )
      case "notificationsSection":
        return (
          <ErrorBoundary>
            <NotificationsCenter userId={currentUser?.id} />
          </ErrorBoundary>
        )
      case "adminDashboard":
        return isAdmin ? (
          <ErrorBoundary>
            <DriverVerificationDashboard />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary>
            <div className="px-4 pt-6 pb-16">
              <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
              <p className="text-gray-300">You don't have permission to access this section.</p>
            </div>
          </ErrorBoundary>
        )
      case "learnMoreSection":
        return (
          <ErrorBoundary>
            <LearnMoreSection />
          </ErrorBoundary>
        )
      case "termsSection":
        return (
          <ErrorBoundary>
            <TermsSection />
          </ErrorBoundary>
        )
      case "privacySection":
        return (
          <ErrorBoundary>
            <PrivacySection />
          </ErrorBoundary>
        )
      case "copyrightSection":
        return (
          <ErrorBoundary>
            <CopyrightSection />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary>
            <HomeSection
              onRequestDelivery={() => setShowRequestModal(true)}
              onLearnMore={() => setCurrentSection("learnMoreSection")}
            />
          </ErrorBoundary>
        )
    }
  }

  const handleShowAuthFromMenu = () => {
    setAuthType("login")
    setShowAuthModal(true)
  }

  if (isLoading) {
    return <SectionLoading message="Initializing VanGo..." />
  }

  return (
    <SettingsProvider userId={currentUser?.id}>
      <NotificationProvider userId={currentUser?.id}>
        <MobileOptimizations>
          <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
            <ErrorBoundary>
              <Header onMenuToggle={() => setIsMenuOpen(true)} user={currentUser} />
            </ErrorBoundary>

            <ErrorBoundary>
              <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                currentSection={currentSection}
                onNavigate={handleSectionChange}
                user={currentUser}
                onLogout={handleLogout}
                onShowAuth={handleShowAuthFromMenu}
              />
            </ErrorBoundary>

            <SwipeGestures onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} className="flex-1">
              <PullToRefresh onRefresh={handleRefresh}>
                <main className="pb-20 pt-4">
                  {needsEmailVerification && (
                    <div className="px-4">
                      <EmailVerificationBanner />
                    </div>
                  )}
                  {renderCurrentSection()}
                </main>
              </PullToRefresh>
            </SwipeGestures>

            <ErrorBoundary>
              <BottomNav
                currentSection={currentSection}
                onNavigate={handleSectionChange}
                onRequestDelivery={() => setShowRequestModal(true)}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              {currentUser ? (
                <DeliveryRequestModal
                  isOpen={showRequestModal}
                  onClose={() => setShowRequestModal(false)}
                  userId={currentUser.id}
                />
              ) : (
                <RequestDeliveryModal
                  isOpen={showRequestModal}
                  onClose={() => setShowRequestModal(false)}
                  onShowAuth={handleShowAuth}
                />
              )}
            </ErrorBoundary>

            <ErrorBoundary>
              <AuthModal
                type={authType}
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setAuthType("register")}
                onSwitchToLogin={() => setAuthType("login")}
              />
            </ErrorBoundary>

            {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />}
          </div>
        </MobileOptimizations>
      </NotificationProvider>
    </SettingsProvider>
  )
}
