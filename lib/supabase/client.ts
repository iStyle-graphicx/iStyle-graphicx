import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function createClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables. Please check your project settings.")
  }

  try {
    client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })

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
