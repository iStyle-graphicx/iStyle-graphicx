"use client"

import { createClient } from "@/lib/supabase/client"
import { paymentService } from "@/lib/payment-service"
import { realtimeTracking } from "@/lib/realtime-tracking"

export interface CreateDeliveryRequest {
  customerId: string
  pickupAddress: string
  deliveryAddress: string
  pickupLat?: number
  pickupLng?: number
  deliveryLat?: number
  deliveryLng?: number
  itemDescription: string
  itemSize: "small" | "medium" | "large"
  itemWeight: "light" | "medium" | "heavy"
  paymentMethod: "paypal" | "eft"
}

export interface DeliveryResponse {
  id: string
  status: string
  deliveryFee: number
  estimatedArrival?: string
}

class DeliveryService {
  // Create fresh client for each operation to ensure proper session handling
  private getSupabase() {
    return createClient()
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryResponse> {
    const supabase = this.getSupabase()
    try {
      const distance = this.calculateDistance(request)
      const deliveryFee = this.calculateDeliveryFee(distance, request.itemSize, request.itemWeight)

      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .insert({
          customer_id: request.customerId,
          pickup_address: request.pickupAddress,
          delivery_address: request.deliveryAddress,
          pickup_lat: request.pickupLat,
          pickup_lng: request.pickupLng,
          delivery_lat: request.deliveryLat,
          delivery_lng: request.deliveryLng,
          item_description: request.itemDescription,
          item_size: request.itemSize,
          item_weight: request.itemWeight,
          delivery_fee: deliveryFee,
          distance_km: distance,
          payment_method: request.paymentMethod,
          payment_status: "pending",
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (deliveryError) throw deliveryError

      if (request.paymentMethod === "paypal") {
        await paymentService.createPayPalPayment({
          amount: deliveryFee,
          currency: "ZAR",
          description: `VanGo Delivery - ${request.itemDescription}`,
          deliveryId: delivery.id,
          customerId: request.customerId,
        })

        await supabase.from("deliveries").update({ payment_status: "processing" }).eq("id", delivery.id)
      }

      // Driver notifications are handled by database trigger (notify_drivers_new_delivery)
      
      await supabase.from("notifications").insert({
        user_id: request.customerId,
        title: "Delivery Request Created",
        message: `Your delivery request has been created. We're finding the best driver for you.`,
        type: "delivery_request",
      })

      return {
        id: delivery.id,
        status: delivery.status,
        deliveryFee,
        estimatedArrival: this.calculateEstimatedArrival(distance),
      }
    } catch (error) {
      console.error("Error creating delivery:", error)
      throw error
    }
  }

  async acceptDelivery(deliveryId: string, driverId: string): Promise<void> {
    const supabase = this.getSupabase()
    try {
      const { data: delivery, error } = await supabase
        .from("deliveries")
        .update({
          driver_id: driverId,
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryId)
        .select()
        .single()

      if (error) throw error

      // Notifications are handled by database trigger (notify_delivery_status_change)

      realtimeTracking.subscribeToDelivery(deliveryId, (update) => {
        // Real-time tracking active
      })
    } catch (error) {
      console.error("Error accepting delivery:", error)
      throw error
    }
  }

  async completeDelivery(deliveryId: string): Promise<void> {
    const supabase = this.getSupabase()
    try {
      const { data: delivery, error } = await supabase
        .from("deliveries")
        .update({
          status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryId)
        .select()
        .single()

      if (error) throw error

      const driverPayout = delivery.delivery_fee * 0.6
      await paymentService.processDriverPayout(delivery.driver_id, driverPayout, deliveryId)

      // Try to use RPC if available, otherwise fallback
      try {
        await supabase.rpc("increment_driver_stats", {
          driver_id: delivery.driver_id,
          earnings: driverPayout,
        })
      } catch {
        // Fallback: manually update driver stats
        const { data: driverData } = await supabase
          .from("drivers")
          .select("total_earnings, total_deliveries")
          .eq("id", delivery.driver_id)
          .single()
        
        if (driverData) {
          await supabase
            .from("drivers")
            .update({
              total_earnings: (driverData.total_earnings || 0) + driverPayout,
              total_deliveries: (driverData.total_deliveries || 0) + 1,
            })
            .eq("id", delivery.driver_id)
        }
      }

      // Customer notification handled by database trigger
      // Driver payment notification
      await supabase.from("notifications").insert({
        user_id: delivery.driver_id,
        title: "Payment Received",
        message: `You earned R${driverPayout.toFixed(2)} for completing the delivery!`,
        type: "payment_received",
      })
    } catch (error) {
      console.error("[v0] Error completing delivery:", error)
      throw error
    }
  }

  private calculateDistance(request: CreateDeliveryRequest): number {
    return Math.random() * 20 + 5
  }

  private calculateDeliveryFee(distance: number, size: string, weight: string): number {
    const baseRate = 50
    const distanceRate = distance * 8
    const sizeMultiplier = size === "small" ? 1 : size === "medium" ? 1.3 : 1.6
    const weightMultiplier = weight === "light" ? 1 : weight === "medium" ? 1.2 : 1.5

    return Math.round((baseRate + distanceRate) * sizeMultiplier * weightMultiplier)
  }

  private calculateEstimatedArrival(distance: number): string {
    const averageSpeed = 40
    const travelTime = (distance / averageSpeed) * 60
    const estimatedTime = new Date(Date.now() + travelTime * 60 * 1000)
    return estimatedTime.toISOString()
  }

  // Driver notifications are now handled by database trigger (notify_drivers_new_delivery)

  async getDeliveryStatus(deliveryId: string) {
    const supabase = this.getSupabase()
    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        driver:drivers(id, vehicle_type, vehicle_make, vehicle_model, rating),
        customer:profiles!deliveries_customer_id_fkey(first_name, last_name, phone)
      `,
      )
      .eq("id", deliveryId)
      .single()

    if (error) throw error
    return data
  }

  async getCustomerDeliveries(customerId: string) {
    const supabase = this.getSupabase()
    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        driver:drivers(id, vehicle_type, rating)
      `,
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getDriverDeliveries(driverId: string) {
    const supabase = this.getSupabase()
    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        customer:profiles!deliveries_customer_id_fkey(first_name, last_name, phone)
      `,
      )
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }
}

export const deliveryService = new DeliveryService()
