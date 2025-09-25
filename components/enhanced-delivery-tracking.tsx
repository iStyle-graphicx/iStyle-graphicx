"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InteractiveMap } from "./interactive-map"
import { realtimeTracking, type DeliveryStatusUpdate, type DeliveryLocationUpdate } from "@/lib/realtime-tracking"
import { createClient } from "@/lib/supabase/client"
import type { DeliveryLocation } from "@/lib/map-config"
import {
  MapPin,
  Clock,
  Truck,
  Package,
  CheckCircle,
  Phone,
  MessageCircle,
  Navigation,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface EnhancedDeliveryTrackingProps {
  deliveryId: string
}

interface DeliveryData {
  id: string
  status: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  estimated_arrival?: string
  driver?: {
    id: string
    first_name: string
    last_name: string
    phone: string
    rating: number
    vehicle_make: string
    vehicle_model: string
    license_plate: string
    avatar_url?: string
  }
}

export function EnhancedDeliveryTracking({ deliveryId }: EnhancedDeliveryTrackingProps) {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDeliveryData()
  }, [deliveryId])

  useEffect(() => {
    if (!delivery?.driver?.id) return

    // Subscribe to delivery status updates
    realtimeTracking.subscribeToDelivery(deliveryId, handleDeliveryUpdate)

    // Subscribe to driver location updates
    realtimeTracking.subscribeToDriverLocation(delivery.driver.id, handleLocationUpdate)

    // Fetch initial driver location
    fetchDriverLocation()

    return () => {
      realtimeTracking.unsubscribeFromDelivery(deliveryId)
      if (delivery.driver?.id) {
        realtimeTracking.unsubscribeFromDriverLocation(delivery.driver.id)
      }
    }
  }, [delivery?.driver?.id])

  const fetchDeliveryData = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          driver:drivers (
            id,
            first_name,
            last_name,
            phone,
            rating,
            vehicle_make,
            vehicle_model,
            license_plate,
            avatar_url
          )
        `)
        .eq("id", deliveryId)
        .single()

      if (error) throw error

      setDelivery(data)
    } catch (error) {
      console.error("[v0] Error fetching delivery:", error)
      setError("Failed to load delivery information")
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverLocation = async () => {
    if (!delivery?.driver?.id) return

    const location = await realtimeTracking.getDriverLocation(delivery.driver.id)
    if (location) {
      setDriverLocation({
        lat: location.latitude,
        lng: location.longitude,
      })

      // Calculate ETA
      if (delivery.dropoff_lat && delivery.dropoff_lng) {
        const etaMinutes = await realtimeTracking.calculateETA(
          { lat: location.latitude, lng: location.longitude },
          { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
        )
        setEta(etaMinutes)
      }
    }
  }

  const handleDeliveryUpdate = (update: DeliveryStatusUpdate) => {
    setDelivery((prev) =>
      prev ? { ...prev, status: update.status, estimated_arrival: update.estimated_arrival } : null,
    )
  }

  const handleLocationUpdate = async (locationUpdate: DeliveryLocationUpdate) => {
    const newLocation = {
      lat: locationUpdate.latitude,
      lng: locationUpdate.longitude,
    }

    setDriverLocation(newLocation)

    // Update ETA
    if (delivery?.dropoff_lat && delivery?.dropoff_lng) {
      const etaMinutes = await realtimeTracking.calculateETA(newLocation, {
        lat: delivery.dropoff_lat,
        lng: delivery.dropoff_lng,
      })
      setEta(etaMinutes)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-blue-500"
      case "picked_up":
        return "bg-orange-500"
      case "in_transit":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: Package },
      { key: "accepted", label: "Driver Assigned", icon: Truck },
      { key: "picked_up", label: "Items Picked Up", icon: CheckCircle },
      { key: "in_transit", label: "On the Way", icon: Navigation },
      { key: "delivered", label: "Delivered", icon: CheckCircle },
    ]

    const statusOrder = ["pending", "accepted", "picked_up", "in_transit", "delivered"]
    const currentIndex = statusOrder.indexOf(delivery?.status || "pending")

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error || "Delivery not found"}</p>
        </CardContent>
      </Card>
    )
  }

  const deliveryLocations: DeliveryLocation[] = [
    {
      id: "pickup",
      address: delivery.pickup_address,
      lat: delivery.pickup_lat,
      lng: delivery.pickup_lng,
      type: "pickup",
      zone: "central",
    },
    {
      id: "dropoff",
      address: delivery.dropoff_address,
      lat: delivery.dropoff_lat,
      lng: delivery.dropoff_lng,
      type: "dropoff",
      zone: "east",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Delivery Status Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Delivery #{deliveryId.slice(-6)}
            </CardTitle>
            <Badge className={`${getStatusColor(delivery.status)} text-white`}>
              {delivery.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Estimated Arrival</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4 text-green-500" />
                {eta ? `${eta} min` : delivery.estimated_arrival || "Calculating..."}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="text-white font-semibold">
                {delivery.status.replace("_", " ").charAt(0).toUpperCase() + delivery.status.replace("_", " ").slice(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      {driverLocation && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <InteractiveMap
              deliveries={deliveryLocations}
              showRoute={true}
              driverLocation={driverLocation}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Driver Information */}
      {delivery.driver && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Your Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={delivery.driver.avatar_url || "/placeholder.svg?height=64&width=64&query=driver"}
                alt={`${delivery.driver.first_name} ${delivery.driver.last_name}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
              />
              <div className="flex-1">
                <h4 className="text-white font-semibold">
                  {delivery.driver.first_name} {delivery.driver.last_name}
                </h4>
                <p className="text-gray-400 text-sm">
                  {delivery.driver.vehicle_make} {delivery.driver.vehicle_model} - {delivery.driver.license_plate}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-white text-sm">{delivery.driver.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500/10 bg-transparent"
                  onClick={() => window.open(`tel:${delivery.driver?.phone}`)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Timeline */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Delivery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getStatusSteps().map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? "bg-green-500" : step.current ? "bg-orange-500" : "bg-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {index < getStatusSteps().length - 1 && (
                      <div className={`w-0.5 h-8 ${step.completed ? "bg-green-500" : "bg-gray-600"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed || step.current ? "text-white" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
