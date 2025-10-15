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
  private supabase = createClient()

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryResponse> {
    try {
      const distance = this.calculateDistance(request)
      const deliveryFee = this.calculateDeliveryFee(distance, request.itemSize, request.itemWeight)

      const { data: delivery, error: deliveryError } = await this.supabase
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

        await this.supabase.from("deliveries").update({ payment_status: "processing" }).eq("id", delivery.id)
      }

      await this.notifyAvailableDrivers(delivery)

      await this.supabase.from("notifications").insert({
        user_id: request.customerId,
        title: "Delivery Request Created",
        message: `Your delivery request has been created. We're finding the best driver for you.`,
        type: "delivery_request",
        metadata: { delivery_id: delivery.id },
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
    try {
      const { data: delivery, error } = await this.supabase
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

      await this.supabase.from("notifications").insert({
        user_id: delivery.customer_id,
        title: "Driver Assigned",
        message: "A driver has accepted your delivery request and is on the way!",
        type: "delivery_accepted",
        metadata: { delivery_id: deliveryId, driver_id: driverId },
      })

      realtimeTracking.subscribeToDelivery(deliveryId, (update) => {
        // Real-time tracking active
      })
    } catch (error) {
      console.error("Error accepting delivery:", error)
      throw error
    }
  }

  async completeDelivery(deliveryId: string): Promise<void> {
    try {
      const { data: delivery, error } = await this.supabase
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

      await this.supabase.rpc("increment_driver_stats", {
        driver_id: delivery.driver_id,
        earnings: driverPayout,
      })

      await this.supabase.from("notifications").insert({
        user_id: delivery.customer_id,
        title: "Delivery Completed",
        message: "Your delivery has been completed successfully!",
        type: "delivery_completed",
        metadata: { delivery_id: deliveryId },
      })

      await this.supabase.from("notifications").insert({
        user_id: delivery.driver_id,
        title: "Payment Received",
        message: `You earned R${driverPayout.toFixed(2)} for completing the delivery!`,
        type: "payment_received",
        metadata: { delivery_id: deliveryId, amount: driverPayout },
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

  private async notifyAvailableDrivers(delivery: any): Promise<void> {
    const { data: drivers } = await this.supabase
      .from("drivers")
      .select("id")
      .eq("is_online", true)
      .eq("verification_status", "approved")

    if (drivers && drivers.length > 0) {
      const notifications = drivers.map((driver) => ({
        user_id: driver.id,
        title: "New Delivery Request",
        message: `${delivery.item_description} - R${delivery.delivery_fee} (${delivery.distance_km?.toFixed(1)}km)`,
        type: "delivery_request",
        metadata: { delivery_id: delivery.id },
      }))

      await this.supabase.from("notifications").insert(notifications)
    }
  }

  async getDeliveryStatus(deliveryId: string) {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
