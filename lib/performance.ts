"use client"

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): void {
    this.metrics.set(label, performance.now())
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(label)
    if (!startTime) {
      console.warn(`No start time found for ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.delete(label)

    if (process.env.NODE_ENV === "development") {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    }

    // Log slow operations in production
    if (process.env.NODE_ENV === "production" && duration > 1000) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(label)
    return fn().finally(() => {
      this.endTiming(label)
    })
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.startTiming(label)
    try {
      return fn()
    } finally {
      this.endTiming(label)
    }
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === "production") {
    // Send to analytics service
    console.log("Web Vital:", metric)
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (performance as any).memory
    const usage = {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576),
    }

    if (usage.used > usage.limit * 0.8) {
      console.warn("High memory usage detected:", usage)
    }

    return usage
  }
  return null
}

// Image optimization helper
export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return "/placeholder.svg"

  // If it's already a placeholder or optimized URL, return as-is
  if (url.includes("placeholder.svg") || url.includes("/_next/image")) {
    return url
  }

  // For production, you might want to use a service like Cloudinary or Vercel's image optimization
  const params = new URLSearchParams()
  if (width) params.set("w", width.toString())
  if (height) params.set("h", height.toString())
  params.set("q", "75") // Quality

  return `/_next/image?url=${encodeURIComponent(url)}&${params.toString()}`
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
