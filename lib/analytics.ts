"use client"

// Analytics and user behavior tracking
export class Analytics {
  private static instance: Analytics
  private events: Array<AnalyticsEvent> = []
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeSession()
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeSession() {
    this.track("session_start", {
      timestamp: Date.now(),
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
      viewport:
        typeof window !== "undefined"
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : null,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  setUserId(userId: string) {
    this.userId = userId
    this.track("user_identified", { userId })
  }

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: typeof window !== "undefined" ? window.location.pathname : "",
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
      },
    }

    this.events.push(analyticsEvent)

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", analyticsEvent)
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalyticsService(analyticsEvent)
    }

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    try {
      // In a real app, you'd send to your analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })

      // For now, store in localStorage for demo purposes
      const stored = localStorage.getItem("vango_analytics") || "[]"
      const events = JSON.parse(stored)
      events.push(event)

      // Keep only last 50 events in storage
      const recentEvents = events.slice(-50)
      localStorage.setItem("vango_analytics", JSON.stringify(recentEvents))
    } catch (error) {
      console.error("Failed to send analytics event:", error)
    }
  }

  // Page view tracking
  trackPageView(page: string, properties: Record<string, any> = {}) {
    this.track("page_view", {
      page,
      ...properties,
    })
  }

  // User interaction tracking
  trackClick(element: string, properties: Record<string, any> = {}) {
    this.track("click", {
      element,
      ...properties,
    })
  }

  trackFormSubmit(form: string, properties: Record<string, any> = {}) {
    this.track("form_submit", {
      form,
      ...properties,
    })
  }

  trackError(error: Error, context = "") {
    this.track("error", {
      message: error.message,
      stack: error.stack,
      context,
      name: error.name,
    })
  }

  // Business-specific events
  trackDeliveryRequest(properties: Record<string, any> = {}) {
    this.track("delivery_request", properties)
  }

  trackDriverSelection(driverId: string, properties: Record<string, any> = {}) {
    this.track("driver_selection", {
      driverId,
      ...properties,
    })
  }

  trackPayment(amount: number, method: string, properties: Record<string, any> = {}) {
    this.track("payment", {
      amount,
      method,
      ...properties,
    })
  }

  // Get analytics data for dashboard
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem("vango_analytics") || "[]"
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  // Generate analytics summary
  generateSummary(): AnalyticsSummary {
    const events = this.getStoredEvents()
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour

    const recentEvents = events.filter((e) => now - e.properties.timestamp < oneHour)
    const todayEvents = events.filter((e) => now - e.properties.timestamp < oneDay)

    const eventCounts = events.reduce(
      (acc, event) => {
        acc[event.event] = (acc[event.event] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const pageCounts = events
      .filter((e) => e.event === "page_view")
      .reduce(
        (acc, event) => {
          const page = event.properties.page
          acc[page] = (acc[page] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      todayEvents: todayEvents.length,
      topEvents: Object.entries(eventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      topPages: Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      sessionId: this.sessionId,
      userId: this.userId,
    }
  }
}

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
}

interface AnalyticsSummary {
  totalEvents: number
  recentEvents: number
  todayEvents: number
  topEvents: [string, number][]
  topPages: [string, number][]
  sessionId: string
  userId?: string
}

// Hook for using analytics
export function useAnalytics() {
  const analytics = Analytics.getInstance()

  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackDeliveryRequest: analytics.trackDeliveryRequest.bind(analytics),
    trackDriverSelection: analytics.trackDriverSelection.bind(analytics),
    trackPayment: analytics.trackPayment.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    getEvents: analytics.getEvents.bind(analytics),
    generateSummary: analytics.generateSummary.bind(analytics),
  }
}
