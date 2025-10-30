"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { realtimeTracking, type DeliveryStatusUpdate, type DeliveryLocationUpdate } from "@/lib/realtime-tracking"
import { InteractiveMap } from "@/components/interactive-map"
import { Package, MapPin, Truck, Clock, Navigation2, Phone } from "lucide-react"

interface TrackSectionProps {
  user: any
}

interface Delivery {
  id: string
  tracking_code: string
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled"
  created_at: string
  pickup_address: string
  delivery_address: string
  pickup_lat?: number
  pickup_lng?: number
  delivery_lat?: number
  delivery_lng?: number
  driver_id?: string
  estimated_delivery?: string
  item_description?: string
  delivery_fee?: number
}

export function TrackSection({ user }: TrackSectionProps) {
  const [trackingCode, setTrackingCode] = useState("")
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [trackedDelivery, setTrackedDelivery] = useState<Delivery | null>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchRecentDeliveries()
    }
  }, [user])

  useEffect(() => {
    if (!trackedDelivery) return

    // Subscribe to delivery status updates
    const statusSubscription = realtimeTracking.subscribeToDelivery(
      trackedDelivery.id,
      (update: DeliveryStatusUpdate) => {
        console.log("[v0] Delivery status updated:", update)
        setTrackedDelivery((prev) => (prev ? { ...prev, ...update } : null))
        toast({
          title: "Status Updated",
          description: `Delivery is now ${update.status.replace("_", " ")}`,
        })
      },
    )

    // Subscribe to driver location updates if driver is assigned
    let driverLocationSubscription: any = null
    if (trackedDelivery.driver_id) {
      driverLocationSubscription = realtimeTracking.subscribeToDriverLocation(
        trackedDelivery.driver_id,
        async (location: DeliveryLocationUpdate) => {
          console.log("[v0] Driver location updated:", location)
          setDriverLocation({ lat: location.latitude, lng: location.longitude })

          // Calculate ETA if delivery address has coordinates
          if (trackedDelivery.delivery_lat && trackedDelivery.delivery_lng) {
            const calculatedEta = await realtimeTracking.calculateETA(
              { lat: location.latitude, lng: location.longitude },
              { lat: trackedDelivery.delivery_lat, lng: trackedDelivery.delivery_lng },
            )
            setEta(calculatedEta)
          }
        },
      )

      // Fetch initial driver location
      fetchDriverLocation(trackedDelivery.driver_id)
    }

    // Cleanup subscriptions on unmount or when delivery changes
    return () => {
      statusSubscription.unsubscribe()
      if (driverLocationSubscription) {
        driverLocationSubscription.unsubscribe()
      }
    }
  }, [trackedDelivery])

  const fetchDriverLocation = async (driverId: string) => {
    const location = await realtimeTracking.getDriverLocation(driverId)
    if (location) {
      setDriverLocation({ lat: location.latitude, lng: location.longitude })

      // Calculate initial ETA
      if (trackedDelivery?.delivery_lat && trackedDelivery?.delivery_lng) {
        const calculatedEta = await realtimeTracking.calculateETA(
          { lat: location.latitude, lng: location.longitude },
          { lat: trackedDelivery.delivery_lat, lng: trackedDelivery.delivery_lng },
        )
        setEta(calculatedEta)
      }
    }
  }

  const fetchRecentDeliveries = async () => {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setRecentDeliveries(data)
    }
  }

  const handleTrackDelivery = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("tracking_code", trackingCode.toUpperCase())
        .single()

      if (data) {
        setTrackedDelivery(data)
        setDriverLocation(null)
        setEta(null)
        toast({
          title: "Delivery Found",
          description: `Status: ${data.status.replace("_", " ").toUpperCase()}`,
        })
      } else {
        toast({
          title: "Not Found",
          description: "No delivery found with this tracking code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error tracking delivery:", error)
      toast({
        title: "Error",
        description: "Failed to track delivery. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "in_transit":
      case "picked_up":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusText = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="w-4 h-4" />
      case "in_transit":
      case "picked_up":
        return <Truck className="w-4 h-4" />
      case "accepted":
        return <Clock className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const mapDeliveries =
    trackedDelivery && trackedDelivery.pickup_lat && trackedDelivery.pickup_lng
      ? [
          {
            lat: trackedDelivery.pickup_lat,
            lng: trackedDelivery.pickup_lng,
            address: trackedDelivery.pickup_address,
            type: "pickup" as const,
          },
          ...(trackedDelivery.delivery_lat && trackedDelivery.delivery_lng
            ? [
                {
                  lat: trackedDelivery.delivery_lat,
                  lng: trackedDelivery.delivery_lng,
                  address: trackedDelivery.delivery_address,
                  type: "delivery" as const,
                },
              ]
            : []),
        ]
      : []

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold text-white">Track Delivery</h2>

      {/* Tracking Input */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Enter Tracking Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Enter tracking code"
              className="bg-slate-700 border-slate-600 text-white flex-1"
              onKeyPress={(e) => e.key === "Enter" && handleTrackDelivery()}
            />
            <Button
              onClick={handleTrackDelivery}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              {isLoading ? "Tracking..." : "Track"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracked Delivery Details with Real-Time Map */}
      {trackedDelivery && (
        <>
          {/* Live Map */}
          {mapDeliveries.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-orange-500" />
                  Live Tracking
                  {driverLocation && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      Live
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap
                  deliveries={mapDeliveries}
                  showRoute={true}
                  driverLocation={driverLocation || undefined}
                  className="h-[400px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Delivery Details */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tracking Code:</span>
                <span className="font-semibold text-white">{trackedDelivery.tracking_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <Badge className={getStatusColor(trackedDelivery.status)}>
                  {getStatusIcon(trackedDelivery.status)}
                  <span className="ml-1">{getStatusText(trackedDelivery.status)}</span>
                </Badge>
              </div>

              {/* ETA Display */}
              {eta !== null && trackedDelivery.status === "in_transit" && (
                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">Estimated Arrival:</span>
                  </div>
                  <span className="font-semibold text-orange-400">{eta} minutes</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">From:</p>
                    <p className="text-white">{trackedDelivery.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">To:</p>
                    <p className="text-white">{trackedDelivery.delivery_address}</p>
                  </div>
                </div>
              </div>

              {trackedDelivery.item_description && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Item:</span>
                  <span className="text-white">{trackedDelivery.item_description}</span>
                </div>
              )}

              {trackedDelivery.delivery_fee && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Delivery Fee:</span>
                  <span className="text-white font-semibold">R{trackedDelivery.delivery_fee}</span>
                </div>
              )}

              {trackedDelivery.estimated_delivery && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Est. Delivery:</span>
                  <span className="text-white">{new Date(trackedDelivery.estimated_delivery).toLocaleString()}</span>
                </div>
              )}

              {/* Driver Contact (if in transit) */}
              {trackedDelivery.driver_id && ["in_transit", "picked_up"].includes(trackedDelivery.status) && (
                <div className="pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Driver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent Deliveries */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentDeliveries.length > 0 ? (
            recentDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  setTrackedDelivery(delivery)
                  setTrackingCode(delivery.tracking_code)
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{delivery.tracking_code}</h4>
                    <p className="text-sm text-gray-400 truncate">{delivery.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(delivery.status)}>
                      {getStatusIcon(delivery.status)}
                      <span className="ml-1">{getStatusText(delivery.status)}</span>
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">{new Date(delivery.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No recent deliveries found</p>
              <p className="text-sm text-gray-500 mt-1">Your delivery history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
