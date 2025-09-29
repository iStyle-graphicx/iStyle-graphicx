"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Navigation, Truck, Package, Maximize2, Minimize2, RefreshCw, Clock, Route } from "lucide-react"

interface LiveMapProps {
  orderId: string
  className?: string
}

interface MapData {
  pickup: { lat: number; lng: number; address: string }
  delivery: { lat: number; lng: number; address: string }
  driver?: { lat: number; lng: number; name: string; vehicle: string }
  status: string
  estimatedArrival?: string
}

export function LiveMap({ orderId, className }: LiveMapProps) {
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMapData()

    // Set up real-time location updates
    const subscription = supabase
      .channel(`driver_location_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
        },
        (payload) => {
          console.log("[v0] Driver location update:", payload)
          updateDriverLocation(payload.new)
        },
      )
      .subscribe()

    // Simulate periodic location updates for demo
    const locationInterval = setInterval(() => {
      simulateDriverMovement()
    }, 10000) // Update every 10 seconds

    return () => {
      subscription.unsubscribe()
      clearInterval(locationInterval)
    }
  }, [orderId])

  const fetchMapData = async () => {
    try {
      const { data: delivery, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          drivers(
            id,
            current_lat,
            current_lng,
            profiles!inner(first_name, last_name),
            vehicle_type
          )
        `)
        .eq("id", orderId)
        .single()

      if (error) throw error

      // Simulate coordinates for demo (in real app, these would come from geocoding)
      const pickupCoords = { lat: -26.2041 + Math.random() * 0.1, lng: 28.0473 + Math.random() * 0.1 }
      const deliveryCoords = { lat: -26.1951 + Math.random() * 0.1, lng: 28.0578 + Math.random() * 0.1 }

      const mapData: MapData = {
        pickup: {
          lat: pickupCoords.lat,
          lng: pickupCoords.lng,
          address: delivery.pickup_address,
        },
        delivery: {
          lat: deliveryCoords.lat,
          lng: deliveryCoords.lng,
          address: delivery.delivery_address,
        },
        status: delivery.status,
      }

      if (delivery.drivers) {
        mapData.driver = {
          lat: delivery.drivers.current_lat || pickupCoords.lat + 0.01,
          lng: delivery.drivers.current_lng || pickupCoords.lng + 0.01,
          name: `${delivery.drivers.profiles.first_name} ${delivery.drivers.profiles.last_name}`,
          vehicle: delivery.drivers.vehicle_type,
        }
      }

      setMapData(mapData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error fetching map data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateDriverLocation = (driverData: any) => {
    if (mapData && driverData.current_lat && driverData.current_lng) {
      setMapData((prev) =>
        prev
          ? {
              ...prev,
              driver: prev.driver
                ? {
                    ...prev.driver,
                    lat: driverData.current_lat,
                    lng: driverData.current_lng,
                  }
                : undefined,
            }
          : null,
      )
      setLastUpdate(new Date())
    }
  }

  const simulateDriverMovement = () => {
    if (mapData?.driver && mapData.status === "in_transit") {
      // Simulate movement towards delivery location
      const deliveryLat = mapData.delivery.lat
      const deliveryLng = mapData.delivery.lng
      const currentLat = mapData.driver.lat
      const currentLng = mapData.driver.lng

      // Move 10% closer to destination
      const newLat = currentLat + (deliveryLat - currentLat) * 0.1
      const newLng = currentLng + (deliveryLng - currentLng) * 0.1

      setMapData((prev) =>
        prev
          ? {
              ...prev,
              driver: prev.driver
                ? {
                    ...prev.driver,
                    lat: newLat,
                    lng: newLng,
                  }
                : undefined,
            }
          : null,
      )
      setLastUpdate(new Date())
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const refreshLocation = () => {
    fetchMapData()
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getEstimatedArrival = () => {
    if (!mapData?.driver) return null

    const distance = calculateDistance(
      mapData.driver.lat,
      mapData.driver.lng,
      mapData.delivery.lat,
      mapData.delivery.lng,
    )

    const avgSpeed = 30 // km/h average city speed
    const timeInHours = distance / avgSpeed
    const timeInMinutes = Math.round(timeInHours * 60)

    return timeInMinutes
  }

  if (isLoading) {
    return (
      <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-700 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!mapData) {
    return (
      <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Unable to load map data</p>
        </CardContent>
      </Card>
    )
  }

  const estimatedArrival = getEstimatedArrival()

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 ${className} ${
        isFullscreen ? "fixed inset-4 z-50" : ""
      }`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Live Tracking</h3>
            {lastUpdate && <p className="text-xs text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshLocation}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Status and ETA */}
        {mapData.driver && estimatedArrival && (
          <div className="flex items-center justify-between mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-white font-medium">{mapData.driver.name}</p>
                <p className="text-xs text-gray-400">{mapData.driver.vehicle}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-400">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{estimatedArrival} min</span>
              </div>
              <p className="text-xs text-gray-400">ETA</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapRef}
          className={`bg-gray-800 rounded-lg relative overflow-hidden ${
            isFullscreen ? "h-[calc(100vh-200px)]" : "h-64"
          }`}
        >
          {/* Simulated Map View */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
            {/* Grid pattern to simulate map */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-8 h-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-gray-600"></div>
                ))}
              </div>
            </div>

            {/* Pickup Location */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: "25%",
                top: "70%",
              }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Pickup
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: "75%",
                top: "30%",
              }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Delivery
                </div>
              </div>
            </div>

            {/* Driver Location */}
            {mapData.driver && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
                style={{
                  left: `${40 + Math.sin(Date.now() / 5000) * 20}%`,
                  top: `${50 + Math.cos(Date.now() / 5000) * 15}%`,
                }}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {mapData.driver.name}
                  </div>
                  {/* Movement indicator */}
                  <div className="absolute inset-0 w-10 h-10 bg-orange-500/30 rounded-full animate-ping"></div>
                </div>
              </div>
            )}

            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <path
                d="M 25% 70% Q 50% 40% 75% 30%"
                stroke="url(#routeGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button variant="outline" size="sm" className="bg-black/50 border-gray-600 text-white hover:bg-black/70">
              <Navigation className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-black/50 border-gray-600 text-white hover:bg-black/70">
              <Route className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30" variant="outline">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
              Live Tracking Active
            </Badge>
          </div>
        </div>

        {/* Location Details */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Package className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">Pickup Location</p>
              <p className="text-xs text-gray-300">{mapData.pickup.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">Delivery Location</p>
              <p className="text-xs text-gray-300">{mapData.delivery.address}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
