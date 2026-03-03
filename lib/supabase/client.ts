import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function createClient() {
  // Only use singleton in the browser; on the server always create a fresh client
  if (typeof window !== "undefined" && browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables. Please check your project settings.")
  }

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: true,
        detectSessionInUrl: typeof window !== "undefined",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })

    if (typeof window !== "undefined") {
      browserClient = client
    }

    return client
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
