"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

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
  const [supabase, setSupabase] = useState<any>(null)

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
          // Fetch user profile from database
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "User",
              userType: profile.user_type as "customer" | "driver",
              joinDate: session.user.created_at,
            }
            setUser(userData)
            try {
              localStorage.setItem("vangoUser", JSON.stringify(userData))
            } catch (storageError) {
              console.warn("[v0] Failed to save user to localStorage:", storageError)
            }
          }
        } else {
          // Check localStorage for existing user data
          try {
            const userData = localStorage.getItem("vangoUser")
            if (userData) {
              setUser(JSON.parse(userData))
            }
          } catch (storageError) {
            console.warn("[v0] Failed to read from localStorage:", storageError)
          }
        }
      } catch (error) {
        console.error("[v0] Auth session error:", error)
        // Fallback to localStorage
        try {
          const userData = localStorage.getItem("vangoUser")
          if (userData) {
            setUser(JSON.parse(userData))
          }
        } catch (storageError) {
          console.warn("[v0] Failed to read from localStorage:", storageError)
        }
      }
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "User",
              userType: profile.user_type as "customer" | "driver",
              joinDate: session.user.created_at,
            }
            setUser(userData)
            try {
              localStorage.setItem("vangoUser", JSON.stringify(userData))
            } catch (storageError) {
              console.warn("[v0] Failed to save user to localStorage:", storageError)
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null)
          try {
            localStorage.removeItem("vangoUser")
          } catch (storageError) {
            console.warn("[v0] Failed to remove user from localStorage:", storageError)
          }
        }
      } catch (error) {
        console.error("[v0] Auth state change error:", error)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const login = (userData: User) => {
    setUser(userData)
    try {
      localStorage.setItem("vangoUser", JSON.stringify(userData))
    } catch (storageError) {
      console.warn("[v0] Failed to save user to localStorage:", storageError)
    }
  }

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
    setUser(null)
    try {
      localStorage.removeItem("vangoUser")
    } catch (storageError) {
      console.warn("[v0] Failed to remove user from localStorage:", storageError)
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
