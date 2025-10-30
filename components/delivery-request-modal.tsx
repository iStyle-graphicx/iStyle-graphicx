"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin, Package, CreditCard } from "lucide-react"
import { PaymentMethodSelector } from "@/components/payment-method-selector"

interface DeliveryRequestModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function DeliveryRequestModal({ isOpen, onClose, userId }: DeliveryRequestModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryData, setDeliveryData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    itemDescription: "",
    itemSize: "medium",
    itemWeight: "light",
    paymentMethod: "paypal" as "paypal" | "eft",
  })
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [distance, setDistance] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  // Calculate delivery fee based on distance and item size
  useEffect(() => {
    if (deliveryData.pickupAddress && deliveryData.deliveryAddress) {
      // Simulate distance calculation (in production, use Google Maps API)
      const estimatedDistance = Math.random() * 20 + 5 // 5-25 km
      setDistance(estimatedDistance)

      // Calculate fee: base rate + distance rate + size multiplier
      const baseRate = 50
      const distanceRate = estimatedDistance * 8 // R8 per km
      const sizeMultiplier = deliveryData.itemSize === "small" ? 1 : deliveryData.itemSize === "medium" ? 1.3 : 1.6
      const weightMultiplier =
        deliveryData.itemWeight === "light" ? 1 : deliveryData.itemWeight === "medium" ? 1.2 : 1.5

      const totalFee = Math.round((baseRate + distanceRate) * sizeMultiplier * weightMultiplier)
      setDeliveryFee(totalFee)
    }
  }, [deliveryData.pickupAddress, deliveryData.deliveryAddress, deliveryData.itemSize, deliveryData.itemWeight])

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      if (!deliveryData.pickupAddress || !deliveryData.deliveryAddress) {
        throw new Error("Please provide both pickup and delivery addresses")
      }

      if (!deliveryData.itemDescription) {
        throw new Error("Please describe the items to be delivered")
      }

      const response = await fetch("/api/deliveries/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickupAddress: deliveryData.pickupAddress,
          deliveryAddress: deliveryData.deliveryAddress,
          itemDescription: deliveryData.itemDescription,
          itemSize: deliveryData.itemSize,
          itemWeight: deliveryData.itemWeight,
          deliveryFee: deliveryFee,
          distanceKm: distance,
          paymentMethod: deliveryData.paymentMethod,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create delivery request")
      }

      if (deliveryData.paymentMethod === "paypal" && result.delivery) {
        try {
          const paymentResponse = await fetch("/api/payments/paypal/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: deliveryFee,
              currency: "ZAR",
              description: `VanGo Delivery - ${deliveryData.itemDescription}`,
              deliveryId: result.delivery.id,
            }),
          })

          if (!paymentResponse.ok) {
            console.error("[v0] Payment creation failed")
            toast({
              title: "Payment Processing",
              description: "Your delivery is created. Payment will be processed shortly.",
            })
          }
        } catch (paymentError) {
          console.error("[v0] Payment error:", paymentError)
        }
      }

      toast({
        title: "Delivery requested successfully!",
        description: "We're finding the best driver for you. You'll be notified when a driver accepts.",
      })

      onClose()
      setStep(1)
      setDeliveryData({
        pickupAddress: "",
        deliveryAddress: "",
        itemDescription: "",
        itemSize: "medium",
        itemWeight: "light",
        paymentMethod: "paypal",
      })
    } catch (error) {
      console.error("[v0] Error creating delivery:", error)
      toast({
        title: "Failed to create delivery",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Request Delivery</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-orange-500" : "bg-slate-600"}`} />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label htmlFor="pickup" className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pickup Address
                </Label>
                <Input
                  id="pickup"
                  value={deliveryData.pickupAddress}
                  onChange={(e) => setDeliveryData({ ...deliveryData, pickupAddress: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="123 Main St, Pretoria"
                  required
                />
              </div>

              <div>
                <Label htmlFor="delivery" className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </Label>
                <Input
                  id="delivery"
                  value={deliveryData.deliveryAddress}
                  onChange={(e) => setDeliveryData({ ...deliveryData, deliveryAddress: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="456 Oak Ave, Johannesburg"
                  required
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={!deliveryData.pickupAddress || !deliveryData.deliveryAddress}
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label htmlFor="description" className="text-white flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Item Description
                </Label>
                <Textarea
                  id="description"
                  value={deliveryData.itemDescription}
                  onChange={(e) => setDeliveryData({ ...deliveryData, itemDescription: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., 10 bags of cement, metal sheets, tools"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size" className="text-white">
                    Item Size
                  </Label>
                  <Select
                    value={deliveryData.itemSize}
                    onValueChange={(value) => setDeliveryData({ ...deliveryData, itemSize: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="weight" className="text-white">
                    Item Weight
                  </Label>
                  <Select
                    value={deliveryData.itemWeight}
                    onValueChange={(value) => setDeliveryData({ ...deliveryData, itemWeight: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="light">Light (&lt;50kg)</SelectItem>
                      <SelectItem value="medium">Medium (50-200kg)</SelectItem>
                      <SelectItem value="heavy">Heavy (&gt;200kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-slate-600 text-white">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!deliveryData.itemDescription}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Distance</span>
                  <span className="text-white font-semibold">{distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Item Size</span>
                  <span className="text-white font-semibold capitalize">{deliveryData.itemSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Item Weight</span>
                  <span className="text-white font-semibold capitalize">{deliveryData.itemWeight}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Total Fee</span>
                    <span className="text-orange-500 font-bold text-xl">R{deliveryFee}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-white flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </Label>
                <PaymentMethodSelector
                  selectedMethod={deliveryData.paymentMethod}
                  onMethodSelect={(method) =>
                    setDeliveryData({ ...deliveryData, paymentMethod: method as "paypal" | "eft" })
                  }
                  amount={deliveryFee}
                  onAddMethod={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Additional payment methods will be available soon.",
                    })
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-slate-600 text-white">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay R${deliveryFee} & Request`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
