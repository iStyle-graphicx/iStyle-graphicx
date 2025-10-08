"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Truck, CheckCircle, MapPin, Star, DollarSign, User, Car } from "lucide-react"

interface DriversPortalSectionProps {
  user: any
}

export function DriversPortalSection({ user }: DriversPortalSectionProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [driverData, setDriverData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  const fetchDriverData = async () => {
    if (user.userType === "driver") {
      const { data, error } = await supabase.from("drivers").select("*").eq("id", user.id).single()

      if (data) setDriverData(data)
    }
  }

  const fetchAvailableDrivers = async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select(`
        *,
        profiles!inner(first_name, last_name, phone)
      `)
      .eq("status", "active")
      .eq("is_online", true)

    if (data) {
      // Add mock locations for Pretoria area
      const driversWithLocations = data.map((driver, index) => ({
        ...driver,
        current_lat: -25.7479 + (Math.random() - 0.5) * 0.1,
        current_lng: 28.2293 + (Math.random() - 0.5) * 0.1,
        distance: Math.round(Math.random() * 15 + 1), // Random distance 1-15km
      }))
      setAvailableDrivers(driversWithLocations)
    }
  }

  const submitDriverApplication = async () => {
    setIsLoading(true)
    const formData = new FormData(document.getElementById("driverForm") as HTMLFormElement)

    const driverInfo = {
      id: user.id,
      vehicle_type: formData.get("vehicleType"),
      license_plate: formData.get("licensePlate"),
      drivers_license: formData.get("driversLicense"),
      account_number: formData.get("accountNumber"),
      status: "pending",
    }

    const { error } = await supabase.from("drivers").insert(driverInfo)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Application Submitted",
        description: "Your driver application has been submitted for review",
      })
      setShowOnboarding(false)
      fetchDriverData()
    }
    setIsLoading(false)
  }

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
          <Badge className={`${driverData.is_online ? "bg-green-500" : "bg-gray-500"} text-white`}>
            {driverData.is_online ? "Online" : "Offline"}
          </Badge>
        </div>

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

      {/* Available Drivers Map */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Available Drivers in Pretoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-800 rounded-lg p-4 mb-4 relative overflow-hidden">
            <div className="text-center text-white mb-4">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-sm">Live Driver Locations</p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {availableDrivers.map((driver) => (
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
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {driver.profiles.first_name} {driver.profiles.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Car className="w-3 h-3" />
                          <span>{driver.vehicle_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{driver.distance}km away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-white text-sm">{driver.rating}</span>
                      </div>
                      <div className="text-xs text-green-400">Online</div>
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
                    <span className="text-white">{selectedDriver.profiles.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="text-white">{selectedDriver.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">License Plate:</span>
                    <span className="text-white">{selectedDriver.license_plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Deliveries:</span>
                    <span className="text-white">{selectedDriver.total_deliveries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating:</span>
                    <span className="text-white flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      {selectedDriver.rating}
                    </span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                  Request This Driver
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Driver Registration */}
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
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Driver Registration - Step {currentStep} of 2</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="driverForm" className="space-y-4">
              {currentStep === 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Your first name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Your last name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Your phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" className="text-white">
                      Bank Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Your bank account number"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2"
                  >
                    Next: Vehicle Information
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="vehicleType" className="text-white">
                      Vehicle Type
                    </Label>
                    <Select name="vehicleType">
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select Vehicle Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="pickup">Pickup Truck</SelectItem>
                        <SelectItem value="van">Van/Minivan</SelectItem>
                        <SelectItem value="light">Light Truck</SelectItem>
                        <SelectItem value="heavy">Heavy Duty Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="licensePlate" className="text-white">
                      License Plate Number
                    </Label>
                    <Input
                      id="licensePlate"
                      name="licensePlate"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g. ABC 123 GP"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="driversLicense" className="text-white">
                      Driver's License Number
                    </Label>
                    <Input
                      id="driversLicense"
                      name="driversLicense"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Your driver's license number"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={submitDriverApplication}
                      disabled={isLoading}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      {isLoading ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
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
