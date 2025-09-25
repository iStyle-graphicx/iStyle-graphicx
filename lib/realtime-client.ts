export interface DeliveryUpdate {
  id: string
  status: "pending" | "accepted" | "in_transit" | "delivered" | "cancelled"
  driverId?: string
  customerId: string
  location?: { lat: number; lng: number }
  estimatedArrival?: string
  message?: string
  timestamp: Date
}

export interface NotificationData {
  id: string
  type: "delivery_request" | "status_update" | "payment_received" | "rating_received"
  title: string
  message: string
  userId: string
  data?: any
  read: boolean
  timestamp: Date
}

class RealtimeClient {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect(userId: string) {
    if (this.eventSource) {
      this.eventSource.close()
    }

    // In a real app, this would connect to your WebSocket/SSE endpoint
    this.eventSource = new EventSource(`/api/realtime?userId=${userId}`)

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data.payload)
      } catch (error) {
        console.error("Failed to parse realtime message:", error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error("Realtime connection error:", error)
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(userId), 5000)
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data))
    }
  }

  // Simulate real-time updates for demo purposes
  simulateDeliveryUpdate(deliveryId: string) {
    const updates = [
      { status: "accepted", message: "Driver has accepted your delivery request" },
      { status: "in_transit", message: "Driver is on the way to pickup location" },
      { status: "delivered", message: "Delivery completed successfully" },
    ]

    updates.forEach((update, index) => {
      setTimeout(
        () => {
          this.emit("delivery_update", {
            id: deliveryId,
            ...update,
            timestamp: new Date(),
          })
        },
        (index + 1) * 10000,
      ) // 10 second intervals
    })
  }
}

export const realtimeClient = new RealtimeClient()
