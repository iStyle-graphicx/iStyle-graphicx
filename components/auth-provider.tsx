"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  name: string
  email: string
  userType: "customer" | "driver"
  joinDate: string
  recentDeliveries?: string[]
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      setIsLoading(false)
      return
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error("[v0] Auth session error:", error)
      }
      setIsLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event)

      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    if (!supabase) return

    try {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", supabaseUser.id).single()

      if (profile) {
        const userData: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || supabaseUser.email || "User",
          userType: profile.user_type as "customer" | "driver",
          joinDate: supabaseUser.created_at,
        }
        setUser(userData)
      }
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
    }
  }

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
