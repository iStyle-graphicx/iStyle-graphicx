"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { MapPin, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Driver {
  id: string
  is_online: boolean
  current_lat: number
  current_lng: number
  vehicle_type: string
  rating: number
  profiles: {
    first_name: string
    last_name: string
  }
}

export default function NewDeliveryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  // Form state
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupLat, setPickupLat] = useState<number>(0)
  const [pickupLng, setPickupLng] = useState<number>(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryLat, setDeliveryLat] = useState<number>(0)
  const [deliveryLng, setDeliveryLng] = useState<number>(0)
  const [itemDescription, setItemDescription] = useState("")
  const [itemSize, setItemSize] = useState("")
  const [itemWeight, setItemWeight] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")

  useEffect(() => {
    loadAvailableDrivers()
    subscribeToDriverUpdates()
  }, [])

  const loadAvailableDrivers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("drivers")
      .select(`
        id,
        is_online,
        current_lat,
        current_lng,
        vehicle_type,
        rating,
        profiles:profiles(first_name, last_name)
      `)
      .eq("status", "verified")
      .eq("is_online", true)

    if (!error && data) {
      setAvailableDrivers(data as Driver[])
    }
  }

  const subscribeToDriverUpdates = () => {
    const supabase = createClient()

    // Subscribe to driver status changes
    const channel = supabase
      .channel("driver-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
          filter: "status=eq.verified",
        },
        (payload) => {
          console.log("[v0] Driver update received:", payload)
          loadAvailableDrivers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const calculateDeliveryFee = () => {
    // Simple calculation based on item size
    const baseFee = 5
    const sizeFees: Record<string, number> = {
      small: 5,
      medium: 10,
      large: 20,
      "extra-large": 30,
    }
    return baseFee + (sizeFees[itemSize] || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const deliveryFee = calculateDeliveryFee()

      // Create delivery request
      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .insert({
          customer_id: user.id,
          pickup_address: pickupAddress,
          pickup_lat: pickupLat || 0,
          pickup_lng: pickupLng || 0,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat || 0,
          delivery_lng: deliveryLng || 0,
          item_description: itemDescription,
          item_size: itemSize,
          item_weight: itemWeight,
          payment_method: paymentMethod,
          delivery_fee: deliveryFee,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single()

      if (deliveryError) throw deliveryError

      // Notify all online drivers
      const notificationPromises = availableDrivers.map((driver) =>
        supabase.from("notifications").insert({
          user_id: driver.id,
          type: "new_delivery_request",
          title: "New Delivery Request",
          message: `New delivery from ${pickupAddress} to ${deliveryAddress}`,
          is_read: false,
        }),
      )

      await Promise.all(notificationPromises)

      router.push(`/customer/delivery/${delivery.id}`)
    } catch (error: any) {
      setError(error.message || "Failed to create delivery request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">New Delivery Request</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pickup Details</CardTitle>
                  <CardDescription>Where should we pick up the item?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pickupAddress">Pickup Address</Label>
                    <Input
                      id="pickupAddress"
                      type="text"
                      placeholder="123 Main St, City"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Details</CardTitle>
                  <CardDescription>Where should we deliver the item?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <Input
                      id="deliveryAddress"
                      type="text"
                      placeholder="456 Oak Ave, City"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Item Information</CardTitle>
                  <CardDescription>Tell us about the item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="itemDescription">Item Description</Label>
                    <Textarea
                      id="itemDescription"
                      placeholder="Describe the item to be delivered"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="itemSize">Item Size</Label>
                      <Select value={itemSize} onValueChange={setItemSize} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (fits in bag)</SelectItem>
                          <SelectItem value="medium">Medium (box size)</SelectItem>
                          <SelectItem value="large">Large (multiple boxes)</SelectItem>
                          <SelectItem value="extra-large">Extra Large (furniture)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="itemWeight">Approximate Weight</Label>
                      <Select value={itemWeight} onValueChange={setItemWeight} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light (under 5kg)</SelectItem>
                          <SelectItem value="medium">Medium (5-20kg)</SelectItem>
                          <SelectItem value="heavy">Heavy (20-50kg)</SelectItem>
                          <SelectItem value="very-heavy">Very Heavy (50kg+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>How would you like to pay?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {itemSize && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Estimated Delivery Fee:</span>
                        <span className="text-2xl font-bold">${calculateDeliveryFee()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Request...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Request Delivery
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Available Drivers</CardTitle>
                <CardDescription>
                  {availableDrivers.length} driver{availableDrivers.length !== 1 ? "s" : ""} online
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableDrivers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No drivers available at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {driver.profiles.first_name} {driver.profiles.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{driver.vehicle_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Online
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
