import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function createClient() {
  // Only use singleton in the browser
  if (typeof window !== "undefined" && browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    })
    throw new Error("Missing Supabase environment variables. Please check your project settings.")
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

    if (typeof window !== "undefined") {
      browserClient = client
    }

    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw error
  }
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
