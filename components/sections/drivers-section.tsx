"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Phone, Navigation, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Driver {
  id: string
  profiles: {
    first_name: string
    last_name: string
    phone: string
    avatar_url?: string
  }
  vehicle_type: string
  vehicle_model: string
  license_plate: string
  rating: number
  total_deliveries: number
  current_lat?: number
  current_lng?: number
  distance?: number
  is_online: boolean
  status: string
}

export function DriversSection() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }

    fetchDrivers()

    const supabase = createClient()
    const channel = supabase
      .channel("drivers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
          filter: "is_online=eq.true",
        },
        () => {
          fetchDrivers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (userLocation) {
        params.append("lat", userLocation.lat.toString())
        params.append("lng", userLocation.lng.toString())
        params.append("radius", "15")
      }

      const response = await fetch(`/api/drivers/availability?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch drivers")
      }

      const data = await response.json()

      setDrivers(data.drivers || [])
    } catch (error) {
      console.error("Error fetching drivers:", error)
      toast({
        title: "Error",
        description: "Failed to load available drivers",
        variant: "destructive",
      })
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    const fullName = `${driver.profiles.first_name} ${driver.profiles.last_name}`.toLowerCase()
    const vehicleInfo = `${driver.vehicle_type} ${driver.vehicle_model}`.toLowerCase()
    const query = searchQuery.toLowerCase()

    return fullName.includes(query) || vehicleInfo.includes(query) || driver.license_plate.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Available Drivers</h2>
        <p className="text-muted-foreground text-sm">Find verified drivers near you who are ready to deliver</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, vehicle, or plate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="ml-3 text-muted-foreground">Loading available drivers...</span>
            </div>
          </Card>
        ) : filteredDrivers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Navigation className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-lg">No Drivers Available</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "No drivers match your search. Try a different query."
                : "There are no online drivers in your area right now. Please check back later."}
            </p>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="p-4 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={driver.profiles.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {driver.profiles.first_name[0]}
                    {driver.profiles.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {driver.profiles.first_name} {driver.profiles.last_name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {driver.vehicle_type} • {driver.vehicle_model}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Online
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{driver.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({driver.total_deliveries} deliveries)</span>
                    </div>

                    {driver.distance !== undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{driver.distance} km away</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{driver.profiles.phone}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Request Sent",
                          description: `Delivery request sent to ${driver.profiles.first_name}`,
                        })
                      }}
                    >
                      Request Delivery
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (driver.current_lat && driver.current_lng) {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${driver.current_lat},${driver.current_lng}`,
                            "_blank",
                          )
                        }
                      }}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      View Location
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
