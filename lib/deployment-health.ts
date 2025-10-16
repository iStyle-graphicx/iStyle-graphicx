// Deployment health check utilities
export async function checkDatabaseConnection() {
  try {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.from("profiles").select("count").limit(1)
    return !error
  } catch {
    return false
  }
}

export async function checkBlobStorage() {
  try {
    return !!process.env.BLOB_READ_WRITE_TOKEN
  } catch {
    return false
  }
}

export async function checkEnvironmentVariables() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "BLOB_READ_WRITE_TOKEN"]

  const missing = required.filter((key) => !process.env[key])
  return {
    isValid: missing.length === 0,
    missing,
  }
}

export async function checkOptionalServices() {
  return {
    whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER),
    paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    weather: !!process.env.OPENWEATHER_API_KEY,
  }
}

export async function performHealthCheck() {
  const [database, blob, envVars, optional] = await Promise.all([
    checkDatabaseConnection(),
    checkBlobStorage(),
    checkEnvironmentVariables(),
    checkOptionalServices(),
  ])

  return {
    status: database && blob && envVars.isValid ? "healthy" : "degraded",
    services: {
      database,
      blob,
      environment: envVars,
      optional,
    },
    timestamp: new Date().toISOString(),
  }
}
