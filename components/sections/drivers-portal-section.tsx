"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Truck, CheckCircle, MapPin, Star, DollarSign, User, Car, Loader2, Search } from "lucide-react"
import { DriverProfileForm } from "@/components/driver-profile-form"
import { DriverAvailabilityToggle } from "@/components/driver-availability-toggle"
import { ProfileVerificationStatus } from "@/components/profile-verification-status"
import { useDebounce } from "@/hooks/use-debounce"

interface DriversPortalSectionProps {
  user: any
}

export function DriversPortalSection({ user }: DriversPortalSectionProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [driverData, setDriverData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDriverData()
      if (user.userType !== "driver") {
        fetchAvailableDrivers()
      }
    }
  }, [user])

  useEffect(() => {
    if (user && user.userType !== "driver") {
      const channel = supabase
        .channel("drivers_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "drivers",
          },
          () => {
            fetchAvailableDrivers()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchDriverData = async () => {
    if (user.userType === "driver") {
      const { data, error } = await supabase.from("drivers").select("*").eq("id", user.id).single()

      if (data) setDriverData(data)
    }
  }

  const fetchAvailableDrivers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select(`
          *,
          profiles!inner(first_name, last_name, phone, avatar_url),
          user_verifications!inner(
            identity_verified,
            drivers_license_verified,
            vehicle_documents_verified
          )
        `)
        .eq("status", "active")
        .eq("is_online", true)
        .eq("user_verifications.identity_verified", true)
        .eq("user_verifications.drivers_license_verified", true)
        .eq("user_verifications.vehicle_documents_verified", true)
        .gte("rating", 3.0)

      if (error) {
        console.error("Error fetching drivers:", error)
        toast({
          title: "Error",
          description: "Failed to load available drivers",
          variant: "destructive",
        })
        return
      }

      if (data && data.length > 0) {
        const driversWithDistance = data
          .map((driver) => ({
            ...driver,
            distance:
              driver.current_lat && driver.current_lng
                ? calculateDistance(-25.7479, 28.2293, driver.current_lat, driver.current_lng)
                : null,
          }))
          .sort((a, b) => {
            if (a.distance && b.distance) return a.distance - b.distance
            return b.rating - a.rating
          })

        setAvailableDrivers(driversWithDistance)
      } else {
        setAvailableDrivers([])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
  }

  const filteredDrivers = availableDrivers.filter((driver) => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    const fullName = `${driver.profiles.first_name} ${driver.profiles.last_name}`.toLowerCase()
    const vehicleType = (driver.vehicle_type || "").toLowerCase()
    return fullName.includes(searchLower) || vehicleType.includes(searchLower)
  })

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-white">Drivers Portal</h2>
        <p className="text-gray-300">Please log in to access the drivers portal.</p>
      </div>
    )
  }

  if (user.userType === "driver" && driverData) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Driver Dashboard</h2>
          <DriverAvailabilityToggle driverId={user.id} />
        </div>

        <ProfileVerificationStatus userId={user.id} userType="driver" />

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500 mb-1">{driverData.total_deliveries}</div>
              <div className="text-sm text-white">Completed Deliveries</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500 mb-1">R {driverData.total_earnings}</div>
              <div className="text-sm text-white">Total Earnings</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Driver Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-white">{driverData.rating}</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= driverData.rating ? "text-yellow-500 fill-current" : "text-gray-400"}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Earning Potential
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Light Materials</span>
              <span className="font-semibold text-white">R30-R45/km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Medium Materials</span>
              <span className="font-semibold text-white">R40-R60/km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Heavy Materials</span>
              <span className="font-semibold text-white">R50-R80/km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Bulk Orders</span>
              <span className="font-semibold text-white">R70-R100/km</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Drivers Portal</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Available VanGo Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableDrivers.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or vehicle type..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-white">Loading available drivers...</span>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-white font-semibold mb-2">
                {searchQuery ? "No Drivers Found" : "No Drivers Available"}
              </p>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "There are currently no verified drivers online in your area. Please try again later."}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-800 rounded-lg p-4 mb-4 relative overflow-hidden">
                <div className="text-center text-white mb-4">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm">
                    {filteredDrivers.length} Verified Driver{filteredDrivers.length !== 1 ? "s" : ""} Online
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {filteredDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedDriver?.id === driver.id
                          ? "bg-orange-500/20 border border-orange-500"
                          : "bg-slate-700/50 hover:bg-slate-700"
                      }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {driver.profiles.avatar_url ? (
                            <img
                              src={driver.profiles.avatar_url || "/placeholder.svg"}
                              alt={`${driver.profiles.first_name} ${driver.profiles.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">
                              {driver.profiles.first_name} {driver.profiles.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Car className="w-3 h-3" />
                              <span>{driver.vehicle_type || "Vehicle"}</span>
                            </div>
                            {driver.distance && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span>{driver.distance}km away</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-white text-sm">{driver.rating?.toFixed(1) || "5.0"}</span>
                          </div>
                          <div className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Online
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDriver && (
                <Card className="bg-slate-700/50 border-orange-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-3">Driver Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">
                          {selectedDriver.profiles.first_name} {selectedDriver.profiles.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{selectedDriver.profiles.phone || "Not available"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vehicle:</span>
                        <span className="text-white">{selectedDriver.vehicle_type || "Standard"}</span>
                      </div>
                      {selectedDriver.license_plate && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">License Plate:</span>
                          <span className="text-white">{selectedDriver.license_plate}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Deliveries:</span>
                        <span className="text-white">{selectedDriver.total_deliveries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <span className="text-white flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {selectedDriver.rating?.toFixed(1) || "5.0"}
                        </span>
                      </div>
                      {selectedDriver.distance && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Distance:</span>
                          <span className="text-white">{selectedDriver.distance}km away</span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                      Request This Driver
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!showOnboarding ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <Truck className="text-orange-500 text-4xl mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2 text-white">Become a VanGo Driver</h3>
            <p className="text-gray-300 mb-4">
              Join our network of delivery drivers and start earning money on your schedule.
            </p>
            <Button
              onClick={() => setShowOnboarding(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-semibold"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DriverProfileForm
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false)
            fetchDriverData()
          }}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Driver Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Valid South African driver's license</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Vehicle in good condition (2010 or newer)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Proof of vehicle insurance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Clean driving record</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Smartphone with data connection</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 w-4 h-4 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Ability to lift up to 25kg</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
