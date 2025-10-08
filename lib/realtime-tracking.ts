"use client"

import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface DeliveryLocationUpdate {
  delivery_id: string
  driver_id: string
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  timestamp: string
}

export interface DeliveryStatusUpdate {
  id: string
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "rated"
  driver_id?: string
  estimated_arrival?: string
  updated_at: string
}

class RealtimeTrackingService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: Map<string, Set<Function>> = new Map()

  // Subscribe to delivery status updates
  subscribeToDelivery(deliveryId: string, callback: (update: DeliveryStatusUpdate) => void) {
    const channelName = `delivery:${deliveryId}`

    if (this.channels.has(channelName)) {
      this.unsubscribeFromDelivery(deliveryId)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          callback(payload.new as DeliveryStatusUpdate)
        },
      )
      .subscribe()

    this.channels.set(channelName, channel)
  }

  // Subscribe to driver location updates
  subscribeToDriverLocation(driverId: string, callback: (location: DeliveryLocationUpdate) => void) {
    const channelName = `driver_location:${driverId}`

    if (this.channels.has(channelName)) {
      this.unsubscribeFromDriverLocation(driverId)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as DeliveryLocationUpdate)
          }
        },
      )
      .subscribe()

    this.channels.set(channelName, channel)
  }

  // Update driver location (for drivers)
  async updateDriverLocation(
    driverId: string,
    location: { lat: number; lng: number; heading?: number; speed?: number },
  ) {
    try {
      const { error } = await this.supabase.from("driver_locations").upsert({
        driver_id: driverId,
        latitude: location.lat,
        longitude: location.lng,
        heading: location.heading,
        speed: location.speed,
        timestamp: new Date().toISOString(),
      })

      if (error) throw error
    } catch (error) {
      console.error("[v0] Error updating driver location:", error)
    }
  }

  // Get current driver location
  async getDriverLocation(driverId: string): Promise<DeliveryLocationUpdate | null> {
    try {
      const { data, error } = await this.supabase
        .from("driver_locations")
        .select("*")
        .eq("driver_id", driverId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error fetching driver location:", error)
      return null
    }
  }

  // Unsubscribe from delivery updates
  unsubscribeFromDelivery(deliveryId: string) {
    const channelName = `delivery:${deliveryId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Unsubscribe from driver location updates
  unsubscribeFromDriverLocation(driverId: string) {
    const channelName = `driver_location:${driverId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Clean up all subscriptions
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  // Calculate ETA based on current location and destination
  async calculateETA(
    driverLocation: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<number> {
    // Simple distance calculation (in a real app, you'd use a routing service)
    const distance = this.calculateDistance(driverLocation, destination)
    const averageSpeed = 40 // km/h average city speed
    const etaMinutes = (distance / averageSpeed) * 60

    return Math.round(etaMinutes)
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const realtimeTracking = new RealtimeTrackingService()
