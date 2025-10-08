"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAnalytics } from "@/lib/analytics"

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusVisible: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void
  announceToScreenReader: (message: string) => void
  isScreenReaderActive: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true,
  })
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)
  const analytics = useAnalytics()

  useEffect(() => {
    // Load accessibility settings from localStorage
    const savedSettings = localStorage.getItem("vango_accessibility_settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings((prev) => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error("Failed to parse accessibility settings:", error)
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings((prev) => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }))
    }

    // Detect screen reader usage
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader =
        navigator.userAgent.includes("NVDA") ||
        navigator.userAgent.includes("JAWS") ||
        navigator.userAgent.includes("VoiceOver") ||
        window.speechSynthesis !== undefined

      setIsScreenReaderActive(hasScreenReader)

      if (hasScreenReader) {
        analytics.track("accessibility_screen_reader_detected")
      }
    }

    detectScreenReader()

    // Listen for media query changes
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)")

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      updateSetting("reducedMotion", e.matches)
    }

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      updateSetting("highContrast", e.matches)
    }

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange)
    highContrastQuery.addEventListener("change", handleHighContrastChange)

    return () => {
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange)
      highContrastQuery.removeEventListener("change", handleHighContrastChange)
    }
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduced-motion")
    } else {
      root.classList.remove("reduced-motion")
    }

    // Large text
    if (settings.largeText) {
      root.classList.add("large-text")
    } else {
      root.classList.remove("large-text")
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible")
    } else {
      root.classList.remove("focus-visible")
    }

    // Save settings to localStorage
    localStorage.setItem("vango_accessibility_settings", JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    analytics.track("accessibility_setting_changed", { setting: key, value })
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)

    analytics.track("accessibility_screen_reader_announcement", { message })
  }

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    announceToScreenReader,
    isScreenReaderActive,
  }

  return <AccessibilityContext.Provider value={contextValue}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}
