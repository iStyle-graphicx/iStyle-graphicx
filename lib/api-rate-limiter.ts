import type { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(identifier: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function getRateLimitIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return ip
}

export function cleanupOldEntries() {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}

setInterval(cleanupOldEntries, 300000)
