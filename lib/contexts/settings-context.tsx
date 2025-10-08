"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SettingsContextType {
  language: string
  theme: string
  setLanguage: (lang: string) => void
  setTheme: (theme: string) => void
  shareApp: () => void
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [language, setLanguageState] = useState("en")
  const [theme, setThemeState] = useState("dark")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Load settings from localStorage first
    const savedLanguage = localStorage.getItem("vango-language") || "en"
    const savedTheme = localStorage.getItem("vango-theme") || "dark"

    setLanguageState(savedLanguage)
    setThemeState(savedTheme)

    // Apply theme to document
    document.documentElement.className = savedTheme

    // Load from database if user is logged in
    if (userId) {
      loadUserSettings()
    }
  }, [userId])

  const loadUserSettings = async () => {
    if (!userId) return

    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

    if (data) {
      setLanguageState(data.language || "en")
      setThemeState(data.theme || "dark")
      localStorage.setItem("vango-language", data.language || "en")
      localStorage.setItem("vango-theme", data.theme || "dark")
      document.documentElement.className = data.theme || "dark"
    }
  }

  const setLanguage = async (lang: string) => {
    setIsLoading(true)
    setLanguageState(lang)
    localStorage.setItem("vango-language", lang)

    if (userId) {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        language: lang,
        theme,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving language setting:", error)
      }
    }

    toast({
      title: "Language Updated",
      description: `App language changed to ${getLanguageName(lang)}`,
    })
    setIsLoading(false)
  }

  const setTheme = async (newTheme: string) => {
    setIsLoading(true)
    setThemeState(newTheme)
    localStorage.setItem("vango-theme", newTheme)
    document.documentElement.className = newTheme

    if (userId) {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        language,
        theme: newTheme,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving theme setting:", error)
      }
    }

    toast({
      title: "Theme Updated",
      description: `App theme changed to ${newTheme}`,
    })
    setIsLoading(false)
  }

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "VanGo Delivery",
          text: "Check out VanGo - Premium Hardware Material Delivery Service!",
          url: window.location.origin,
        })

        toast({
          title: "Shared Successfully",
          description: "Thanks for sharing VanGo!",
        })
      } catch (error) {
        // Handle permission denied or user cancelled sharing
        if (error instanceof Error && error.name === "NotAllowedError") {
          // User denied permission or cancelled, fall back to clipboard
          fallbackToClipboard()
        } else if (error instanceof Error && error.name === "AbortError") {
          // User cancelled the share dialog, do nothing
          return
        } else {
          // Other errors, fall back to clipboard
          fallbackToClipboard()
        }
      }
    } else {
      // Browser doesn't support Web Share API
      fallbackToClipboard()
    }
  }

  const fallbackToClipboard = async () => {
    const shareText = `Check out VanGo - Premium Hardware Material Delivery Service! ${window.location.origin}`

    try {
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard!",
      })
    } catch (clipboardError) {
      // If clipboard also fails, show the text for manual copying
      toast({
        title: "Share VanGo",
        description: shareText,
        duration: 10000, // Show longer so user can copy manually
      })
    }
  }

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: "English",
      af: "Afrikaans",
      zu: "Zulu",
      st: "Sotho",
    }
    return languages[code] || "English"
  }

  return (
    <SettingsContext.Provider
      value={{
        language,
        theme,
        setLanguage,
        setTheme,
        shareApp,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
