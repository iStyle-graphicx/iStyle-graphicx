"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  Truck,
  Package,
  CheckCircle,
  Phone,
  MessageCircle,
  Navigation,
  Star,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

interface OrderTrackerProps {
  orderId: string
  onClose?: () => void
}

interface TrackingData {
  id: string
  status: string
  pickup_address: string
  delivery_address: string
  item_description: string
  delivery_fee: number
  created_at: string
  estimated_delivery: string
  driver?: {
    id: string
    first_name: string
    last_name: string
    phone: string
    rating: number
    vehicle_type: string
    vehicle_plate: string
    current_lat?: number
    current_lng?: number
    profile_image?: string
  }
  tracking_updates: Array<{
    id: string
    status: string
    message: string
    location?: string
    timestamp: string
    lat?: number
    lng?: number
  }>
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "accepted", label: "Driver Assigned", icon: Truck },
  { key: "pickup", label: "Pickup Complete", icon: CheckCircle },
  { key: "in_transit", label: "In Transit", icon: Navigation },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
]

const STATUS_COLORS = {
  pending: "text-yellow-400",
  accepted: "text-blue-400",
  pickup: "text-orange-400",
  in_transit: "text-orange-400",
  delivered: "text-green-400",
  cancelled: "text-red-400",
}

export function OrderTracker({ orderId, onClose }: OrderTrackerProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTrackingData()

    // Set up real-time subscription for tracking updates
    const subscription = supabase
      .channel(`order_tracking_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[v0] Real-time update received:", payload)
          fetchTrackingData()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_tracking",
          filter: `delivery_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[v0] Tracking update received:", payload)
          fetchTrackingData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  const fetchTrackingData = async () => {
    try {
      if (!refreshing) setIsLoading(true)

      // Fetch delivery details with driver info
      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .select(`
          *,
          drivers(
            id,
            rating,
            vehicle_type,
            vehicle_plate,
            current_lat,
            current_lng,
            profiles!inner(first_name, last_name, phone, profile_image)
          )
        `)
        .eq("id", orderId)
        .single()

      if (deliveryError) throw deliveryError

      // Fetch tracking updates
      const { data: trackingUpdates, error: trackingError } = await supabase
        .from("delivery_tracking")
        .select("*")
        .eq("delivery_id", orderId)
        .order("created_at", { ascending: true })

      if (trackingError) throw trackingError

      const formattedData: TrackingData = {
        ...delivery,
        driver: delivery.drivers
          ? {
              id: delivery.drivers.id,
              first_name: delivery.drivers.profiles.first_name,
              last_name: delivery.drivers.profiles.last_name,
              phone: delivery.drivers.profiles.phone,
              rating: delivery.drivers.rating,
              vehicle_type: delivery.drivers.vehicle_type,
              vehicle_plate: delivery.drivers.vehicle_plate,
              current_lat: delivery.drivers.current_lat,
              current_lng: delivery.drivers.current_lng,
              profile_image: delivery.drivers.profiles.profile_image,
            }
          : undefined,
        tracking_updates: trackingUpdates || [],
      }

      setTrackingData(formattedData)
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      toast({
        title: "Error",
        description: "Failed to load tracking information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const refreshTracking = async () => {
    setRefreshing(true)
    await fetchTrackingData()
  }

  const getCurrentStepIndex = () => {
    if (!trackingData) return 0
    return STATUS_STEPS.findIndex((step) => step.key === trackingData.status)
  }

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex()
    return ((currentIndex + 1) / STATUS_STEPS.length) * 100
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const callDriver = () => {
    if (trackingData?.driver?.phone) {
      window.location.href = `tel:${trackingData.driver.phone}`
    }
  }

  const messageDriver = () => {
    if (trackingData?.driver?.phone) {
      window.location.href = `sms:${trackingData.driver.phone}`
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-700 rounded-lg"></div>
          <div className="h-48 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!trackingData) {
    return (
      <div className="px-4 pt-6 pb-16">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Order Not Found</h3>
            <p className="text-gray-400">Unable to load tracking information for this order.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Track Order</h1>
          <p className="text-gray-400">#{trackingData.id.slice(0, 8)}</p>
        </div>
        <Button
          onClick={refreshTracking}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Status Progress */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Delivery Progress</h3>
            <Badge
              className={`${STATUS_COLORS[trackingData.status as keyof typeof STATUS_COLORS]} border-current`}
              variant="outline"
            >
              {STATUS_STEPS.find((s) => s.key === trackingData.status)?.label || trackingData.status}
            </Badge>
          </div>

          <Progress value={getProgressPercentage()} className="mb-6" />

          <div className="space-y-4">
            {STATUS_STEPS.map((step, index) => {
              const currentIndex = getCurrentStepIndex()
              const isCompleted = index <= currentIndex
              const isCurrent = index === currentIndex
              const Icon = step.icon

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? "bg-orange-500" : "bg-gray-600"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCompleted ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? "text-white" : "text-gray-400"}`}>{step.label}</p>
                    {isCurrent && <p className="text-sm text-orange-400">Current status</p>}
                  </div>
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {trackingData.driver && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Driver</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                {trackingData.driver.profile_image ? (
                  <img
                    src={trackingData.driver.profile_image || "/placeholder.svg"}
                    alt="Driver"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <Truck className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">
                  {trackingData.driver.first_name} {trackingData.driver.last_name}
                </h4>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-gray-300">{trackingData.driver.rating}</span>
                </div>
                <p className="text-sm text-gray-400">
                  {trackingData.driver.vehicle_type} • {trackingData.driver.vehicle_plate}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={callDriver} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button
                onClick={messageDriver}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Order Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Item</p>
              <p className="text-white font-medium">{trackingData.item_description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Pickup Address
                </p>
                <p className="text-white">{trackingData.pickup_address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Delivery Address
                </p>
                <p className="text-white">{trackingData.delivery_address}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-gray-400">Total Cost</span>
              <span className="text-orange-500 font-semibold text-lg">R{trackingData.delivery_fee}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      {trackingData.tracking_updates.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tracking Updates</h3>
            <div className="space-y-4">
              {trackingData.tracking_updates.map((update, index) => (
                <div key={update.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    {index < trackingData.tracking_updates.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-white capitalize">{update.status.replace("_", " ")}</p>
                      <span className="text-xs text-gray-400">{formatTime(update.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{update.message}</p>
                    {update.location && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {update.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Map Placeholder */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Live Location</h3>
          <div className="bg-gray-800 rounded-lg h-48 flex items-center justify-center">
            <div className="text-center">
              <Navigation className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">Interactive map coming soon</p>
              <p className="text-xs text-gray-500 mt-1">Track your driver's location in real-time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
