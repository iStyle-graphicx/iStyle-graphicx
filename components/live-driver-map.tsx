"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  Truck,
  RefreshCw,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  Star,
  Phone,
  Navigation,
} from "lucide-react"

interface DriverOnMap {
  id: string
  current_lat: number
  current_lng: number
  is_online: boolean
  is_busy: boolean
  availability_status: "available" | "busy"
  rating: number
  total_deliveries: number
  vehicle_type: string
  distance?: number
  profiles: {
    first_name: string
    last_name: string
    phone: string
    avatar_url?: string
  }
}

interface LiveDriverMapProps {
  className?: string
  onRequestDriver?: (driver: DriverOnMap) => void
}

export function LiveDriverMap({ className, onRequestDriver }: LiveDriverMapProps) {
  const [drivers, setDrivers] = useState<DriverOnMap[]>([])
  const [selectedDriver, setSelectedDriver] = useState<DriverOnMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [availableCount, setAvailableCount] = useState(0)
  const [busyCount, setBusyCount] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchDrivers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (userLocation) {
        params.append("lat", userLocation.lat.toString())
        params.append("lng", userLocation.lng.toString())
        params.append("radius", "50")
      }

      const response = await fetch(`/api/drivers/availability?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch drivers")

      const data = await response.json()
      setDrivers(data.drivers || [])
      setAvailableCount(data.availableCount || 0)
      setBusyCount(data.busyCount || 0)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error fetching live drivers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default to Johannesburg area if location denied
          setUserLocation({ lat: -26.2041, lng: 28.0473 })
        },
      )
    } else {
      setUserLocation({ lat: -26.2041, lng: 28.0473 })
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchDrivers()
    }
  }, [userLocation, fetchDrivers])

  // Real-time subscription for driver changes
  useEffect(() => {
    const channel = supabase
      .channel("live_driver_map")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
        },
        () => {
          fetchDrivers()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
        },
        () => {
          // Refetch when delivery status changes (driver becomes busy/available)
          fetchDrivers()
        },
      )
      .subscribe()

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchDrivers, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchDrivers])

  const getDriverPosition = (driver: DriverOnMap, index: number) => {
    // Position drivers on the visual map based on their coordinates
    // Use a normalized positioning relative to the user or a default center
    const centerLat = userLocation?.lat || -26.2041
    const centerLng = userLocation?.lng || 28.0473

    if (driver.current_lat && driver.current_lng) {
      const latOffset = (driver.current_lat - centerLat) * 800
      const lngOffset = (driver.current_lng - centerLng) * 800
      return {
        left: `${Math.min(Math.max(50 + lngOffset, 8), 92)}%`,
        top: `${Math.min(Math.max(50 - latOffset, 8), 92)}%`,
      }
    }

    // Fallback: spread around the map
    const angle = (index / Math.max(drivers.length, 1)) * 2 * Math.PI
    const radius = 25 + (index % 3) * 10
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`,
    }
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

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 ${className} ${
        isFullscreen ? "fixed inset-4 z-50" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Live Driver Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchDrivers}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {availableCount} Available
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
            {busyCount} Busy
          </Badge>
          <Badge className="bg-white/10 text-gray-300 border-white/20 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {drivers.length} Total
          </Badge>
        </div>

        {/* Map Container */}
        <div
          className={`bg-gray-800 rounded-lg relative overflow-hidden ${
            isFullscreen ? "h-[calc(100vh-320px)]" : "h-72"
          }`}
        >
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="grid grid-cols-10 grid-rows-10 h-full">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="border border-gray-500" />
              ))}
            </div>
          </div>

          {/* Road-like lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6b7280" strokeWidth="2" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#6b7280" strokeWidth="2" />
            <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="80%" y1="0" x2="20%" y2="100%" stroke="#6b7280" strokeWidth="1" strokeDasharray="5,5" />
          </svg>

          {/* User Location Marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: "50%", top: "50%" }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="absolute inset-0 w-6 h-6 bg-blue-500/30 rounded-full animate-ping" />
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-medium">
                You
              </div>
            </div>
          </div>

          {/* Driver Markers */}
          {drivers.map((driver, index) => {
            const position = getDriverPosition(driver, index)
            const isAvailable = driver.availability_status === "available"
            const isSelected = selectedDriver?.id === driver.id

            return (
              <div
                key={driver.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20"
                style={{ left: position.left, top: position.top }}
                onClick={() => setSelectedDriver(isSelected ? null : driver)}
              >
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isAvailable
                        ? "bg-green-500 hover:scale-110"
                        : "bg-orange-500 hover:scale-110"
                    } ${isSelected ? "scale-125 ring-2 ring-white" : ""}`}
                  >
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  {/* Pulse for available drivers */}
                  {isAvailable && (
                    <div className="absolute inset-0 w-9 h-9 bg-green-500/30 rounded-full animate-ping" />
                  )}
                  {/* Name label */}
                  <div
                    className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-medium ${
                      isAvailable
                        ? "bg-green-500/90 text-white"
                        : "bg-orange-500/90 text-white"
                    }`}
                  >
                    {driver.profiles.first_name}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {drivers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Truck className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No drivers online in your area</p>
                <p className="text-gray-500 text-xs mt-1">Check back in a few minutes</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-[10px] text-gray-300">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-[10px] text-gray-300">Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-[10px] text-gray-300">Your Location</span>
            </div>
          </div>
        </div>

        {/* Selected Driver Info */}
        {selectedDriver && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedDriver.availability_status === "available"
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                >
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {selectedDriver.profiles.first_name} {selectedDriver.profiles.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedDriver.vehicle_type || "Standard Vehicle"}
                  </p>
                </div>
              </div>
              <Badge
                className={
                  selectedDriver.availability_status === "available"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                }
              >
                {selectedDriver.availability_status === "available" ? (
                  <>
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                    Available
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    On Delivery
                  </>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-sm font-bold">{selectedDriver.rating?.toFixed(1) || "5.0"}</span>
                </div>
                <p className="text-[10px] text-gray-400">Rating</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-sm font-bold text-white">{selectedDriver.total_deliveries || 0}</p>
                <p className="text-[10px] text-gray-400">Deliveries</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-sm font-bold text-white">
                  {selectedDriver.distance ? `${selectedDriver.distance}km` : "N/A"}
                </p>
                <p className="text-[10px] text-gray-400">Distance</p>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedDriver.availability_status === "available" ? (
                <Button
                  onClick={() => onRequestDriver?.(selectedDriver)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Request This Driver
                </Button>
              ) : (
                <Button
                  disabled
                  className="flex-1 bg-gray-600 text-gray-300 cursor-not-allowed"
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Currently on Delivery
                </Button>
              )}
              {selectedDriver.profiles.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => window.open(`tel:${selectedDriver.profiles.phone}`)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Driver List Summary */}
        {drivers.length > 0 && !selectedDriver && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Tap a driver on the map for details</p>
            <div className="flex flex-wrap gap-2">
              {drivers.slice(0, 5).map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      driver.availability_status === "available"
                        ? "bg-green-400 animate-pulse"
                        : "bg-orange-400"
                    }`}
                  />
                  <span className="text-xs text-white">{driver.profiles.first_name}</span>
                  <span className="text-xs text-gray-400">
                    {driver.distance ? `${driver.distance}km` : ""}
                  </span>
                </button>
              ))}
              {drivers.length > 5 && (
                <span className="flex items-center text-xs text-gray-400 px-2">
                  +{drivers.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
