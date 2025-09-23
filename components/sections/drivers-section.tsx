"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Star, Phone, Car, User } from "lucide-react"

interface Driver {
  id: string
  name: string
  rating: number
  vehicle_type: string
  location: string
  distance: string
  status: "available" | "busy" | "offline"
  phone: string
  experience_years: number
  completed_deliveries: number
  avatar_url?: string
  lat?: number
  lng?: number
}

interface DriversSectionProps {
  user: any
  onRequestDriver: (driver: Driver) => void
}

export function DriversSection({ user, onRequestDriver }: DriversSectionProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadAvailableDrivers()
  }, [])

  const loadAvailableDrivers = async () => {
    setIsLoading(true)

    // Load sample drivers for Pretoria area
    const sampleDrivers: Driver[] = [
      {
        id: "1",
        name: "John Smith",
        rating: 4.8,
        vehicle_type: "Bakkie",
        location: "Centurion",
        distance: "2.3 km",
        status: "available",
        phone: "+27 82 123 4567",
        experience_years: 5,
        completed_deliveries: 234,
        lat: -25.8601,
        lng: 28.1878,
      },
      {
        id: "2",
        name: "Sarah Johnson",
        rating: 4.9,
        vehicle_type: "Truck",
        location: "Hatfield",
        distance: "3.1 km",
        status: "available",
        phone: "+27 83 987 6543",
        experience_years: 8,
        completed_deliveries: 456,
        lat: -25.7479,
        lng: 28.2293,
      },
      {
        id: "3",
        name: "Mike Williams",
        rating: 4.7,
        vehicle_type: "Van",
        location: "Brooklyn",
        distance: "1.8 km",
        status: "busy",
        phone: "+27 84 555 1234",
        experience_years: 3,
        completed_deliveries: 189,
        lat: -25.7615,
        lng: 28.2292,
      },
      {
        id: "4",
        name: "Lisa Brown",
        rating: 4.6,
        vehicle_type: "Bakkie",
        location: "Menlyn",
        distance: "4.2 km",
        status: "available",
        phone: "+27 85 777 8888",
        experience_years: 4,
        completed_deliveries: 167,
        lat: -25.7863,
        lng: 28.2775,
      },
      {
        id: "5",
        name: "David Wilson",
        rating: 4.9,
        vehicle_type: "Truck",
        location: "Arcadia",
        distance: "2.7 km",
        status: "available",
        phone: "+27 86 333 2222",
        experience_years: 7,
        completed_deliveries: 389,
        lat: -25.7545,
        lng: 28.2314,
      },
    ]

    // If user is authenticated, try to load from database
    if (user) {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("status", "available")
        .order("rating", { ascending: false })

      if (data && data.length > 0) {
        setDrivers(data)
      } else {
        setDrivers(sampleDrivers)
      }
    } else {
      setDrivers(sampleDrivers)
    }

    setIsLoading(false)
  }

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver)
  }

  const handleRequestDriver = () => {
    if (selectedDriver) {
      onRequestDriver(selectedDriver)
      toast({
        title: "Driver Requested",
        description: `Request sent to ${selectedDriver.name}`,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "busy":
        return "bg-orange-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available"
      case "busy":
        return "Busy"
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Available Drivers</h2>
        <Button
          onClick={loadAvailableDrivers}
          variant="outline"
          className="border-orange-500 text-orange-500 hover:bg-orange-500/10 bg-transparent"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Map Placeholder */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="bg-slate-800 rounded-lg h-48 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20"></div>
            <div className="text-center z-10">
              <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <p className="text-white font-semibold">Pretoria Area Map</p>
              <p className="text-gray-400 text-sm">
                {drivers.filter((d) => d.status === "available").length} drivers available nearby
              </p>
            </div>
            {/* Driver location indicators */}
            <div className="absolute top-4 left-8 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-12 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 left-16 w-3 h-3 bg-orange-500 rounded-full"></div>
            <div className="absolute bottom-16 right-8 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute top-20 left-1/2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <div className="space-y-3">
        {drivers.map((driver) => (
          <Card
            key={driver.id}
            className={`bg-white/10 backdrop-blur-md border-white/20 cursor-pointer transition-all ${
              selectedDriver?.id === driver.id ? "ring-2 ring-orange-500 bg-white/20" : "hover:bg-white/15"
            }`}
            onClick={() => handleDriverSelect(driver)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                  {driver.avatar_url ? (
                    <img
                      src={driver.avatar_url || "/placeholder.svg"}
                      alt={driver.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-white">{driver.name}</h3>
                    <Badge className={`${getStatusColor(driver.status)} text-white text-xs`}>
                      {getStatusText(driver.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{driver.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4" />
                      <span>{driver.vehicle_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {driver.location} • {driver.distance}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{driver.experience_years} years exp.</span>
                    <span>{driver.completed_deliveries} deliveries</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Driver Details */}
      {selectedDriver && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Driver Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                {selectedDriver.avatar_url ? (
                  <img
                    src={selectedDriver.avatar_url || "/placeholder.svg"}
                    alt={selectedDriver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{selectedDriver.name}</h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{selectedDriver.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{selectedDriver.rating}</div>
                <div className="text-xs text-gray-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{selectedDriver.completed_deliveries}</div>
                <div className="text-xs text-gray-400">Deliveries</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Vehicle:</span>
                <span className="text-white">{selectedDriver.vehicle_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Experience:</span>
                <span className="text-white">{selectedDriver.experience_years} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span className="text-white">{selectedDriver.distance} away</span>
              </div>
            </div>

            <Button
              onClick={handleRequestDriver}
              disabled={selectedDriver.status !== "available"}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold"
            >
              {selectedDriver.status === "available" ? "Request This Driver" : "Driver Not Available"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
