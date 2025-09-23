"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Smartphone, Building2, ArrowLeft } from "lucide-react"

interface RequestDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RequestDeliveryModal({ isOpen, onClose }: RequestDeliveryModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    pickupLocation: "",
    deliveryLocation: "",
    materialType: "",
    materialWeight: "",
    deliveryNotes: "",
    receiptFile: null as File | null,
  })
  const [paymentData, setPaymentData] = useState({
    method: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    paypalEmail: "",
    bankAccount: "",
    bankCode: "",
  })
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const userData = localStorage.getItem("vangoUser")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const materialTypes = [
    { value: "cement", label: "Cement" },
    { value: "bricks", label: "Bricks" },
    { value: "timber", label: "Timber" },
    { value: "metal", label: "Metal Sheets" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "other", label: "Other" },
  ]

  const calculateEstimatedCost = () => {
    const weight = Number.parseInt(formData.materialWeight) || 0
    const baseRate = 50 // Base rate in ZAR
    const weightRate = weight * 2 // R2 per kg
    const total = baseRate + weightRate
    setEstimatedCost(total)
  }

  const processPayment = async () => {
    setIsLoading(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create delivery record in database
      const deliveryData = {
        customer_id: user?.id,
        pickup_address: formData.pickupLocation,
        delivery_address: formData.deliveryLocation,
        item_description: `${formData.materialType} - ${formData.materialWeight}kg`,
        item_weight: formData.materialWeight,
        delivery_fee: estimatedCost,
        payment_method: paymentData.method,
        payment_status: "paid",
        status: "pending",
      }

      const { data, error } = await supabase.from("deliveries").insert(deliveryData).select().single()

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user?.id,
        title: "Delivery Request Confirmed",
        message: `Your delivery request has been confirmed. Tracking ID: ${data.id.slice(0, 8)}`,
        type: "success",
      })

      toast({
        title: "Payment Successful!",
        description: `Delivery requested successfully. Tracking ID: ${data.id.slice(0, 8)}`,
      })

      // Reset form and close modal
      setFormData({
        pickupLocation: "",
        deliveryLocation: "",
        materialType: "",
        materialWeight: "",
        deliveryNotes: "",
        receiptFile: null,
      })
      setPaymentData({
        method: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        paypalEmail: "",
        bankAccount: "",
        bankCode: "",
      })
      setEstimatedCost(0)
      setCurrentStep(1)
      onClose()
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1) {
      setCurrentStep(2)
    } else {
      await processPayment()
    }
  }

  const renderPaymentMethod = () => {
    switch (paymentData.method) {
      case "mastercard":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber" className="text-white">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate" className="text-white">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-white">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </div>
        )
      case "paypal":
        return (
          <div>
            <Label htmlFor="paypalEmail" className="text-white">
              PayPal Email
            </Label>
            <Input
              id="paypalEmail"
              type="email"
              value={paymentData.paypalEmail}
              onChange={(e) => setPaymentData({ ...paymentData, paypalEmail: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="your@email.com"
              required
            />
          </div>
        )
      case "eft":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankAccount" className="text-white">
                Bank Account Number
              </Label>
              <Input
                id="bankAccount"
                value={paymentData.bankAccount}
                onChange={(e) => setPaymentData({ ...paymentData, bankAccount: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="1234567890"
                required
              />
            </div>
            <div>
              <Label htmlFor="bankCode" className="text-white">
                Bank Code
              </Label>
              <Input
                id="bankCode"
                value={paymentData.bankCode}
                onChange={(e) => setPaymentData({ ...paymentData, bankCode: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="123456"
                required
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            {currentStep === 1 ? "Request Delivery" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 ? (
            <>
              <div>
                <Label htmlFor="pickupLocation" className="text-white">
                  Pickup Location
                </Label>
                <Input
                  id="pickupLocation"
                  type="text"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter pickup address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="deliveryLocation" className="text-white">
                  Delivery Location
                </Label>
                <Input
                  id="deliveryLocation"
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter delivery address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="materialType" className="text-white">
                  Material Type
                </Label>
                <Select
                  value={formData.materialType}
                  onValueChange={(value) => setFormData({ ...formData, materialType: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {materialTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="materialWeight" className="text-white">
                  Approximate Weight (kg)
                </Label>
                <Input
                  id="materialWeight"
                  type="number"
                  value={formData.materialWeight}
                  onChange={(e) => {
                    setFormData({ ...formData, materialWeight: e.target.value })
                    calculateEstimatedCost()
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Weight in kilograms"
                  required
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="deliveryNotes" className="text-white">
                  Special Instructions
                </Label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                  placeholder="Any special instructions for the driver"
                />
              </div>

              <div>
                <Label htmlFor="receiptUpload" className="text-white">
                  Upload Receipt (Optional)
                </Label>
                <Input
                  id="receiptUpload"
                  type="file"
                  onChange={(e) => setFormData({ ...formData, receiptFile: e.target.files?.[0] || null })}
                  className="bg-slate-700 border-slate-600 text-white"
                  accept="image/*"
                />
              </div>

              {estimatedCost > 0 && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-white">Estimated Cost</h3>
                  <p className="text-orange-500 text-2xl font-bold">R {estimatedCost.toFixed(2)}</p>
                  <p className="text-gray-300 text-sm">Final cost may vary based on actual distance</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                disabled={
                  !formData.pickupLocation ||
                  !formData.deliveryLocation ||
                  !formData.materialType ||
                  !formData.materialWeight
                }
              >
                Continue to Payment
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-white">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">From:</span>
                      <span className="text-white">{formData.pickupLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">To:</span>
                      <span className="text-white">{formData.deliveryLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Item:</span>
                      <span className="text-white">
                        {formData.materialType} ({formData.materialWeight}kg)
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-white/20">
                      <span className="text-white">Total:</span>
                      <span className="text-orange-500">R {estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Select Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Card
                      className={`cursor-pointer transition-all ${paymentData.method === "mastercard" ? "border-orange-500 bg-orange-500/10" : "border-slate-600 bg-slate-700/50"}`}
                      onClick={() => setPaymentData({ ...paymentData, method: "mastercard" })}
                    >
                      <CardContent className="p-3 text-center">
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-white" />
                        <p className="text-xs text-white">Mastercard</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all ${paymentData.method === "paypal" ? "border-orange-500 bg-orange-500/10" : "border-slate-600 bg-slate-700/50"}`}
                      onClick={() => setPaymentData({ ...paymentData, method: "paypal" })}
                    >
                      <CardContent className="p-3 text-center">
                        <Smartphone className="w-6 h-6 mx-auto mb-2 text-white" />
                        <p className="text-xs text-white">PayPal</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all ${paymentData.method === "eft" ? "border-orange-500 bg-orange-500/10" : "border-slate-600 bg-slate-700/50"}`}
                      onClick={() => setPaymentData({ ...paymentData, method: "eft" })}
                    >
                      <CardContent className="p-3 text-center">
                        <Building2 className="w-6 h-6 mx-auto mb-2 text-white" />
                        <p className="text-xs text-white">EFT</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {paymentData.method && <div className="space-y-4">{renderPaymentMethod()}</div>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                    disabled={isLoading || !paymentData.method}
                  >
                    {isLoading ? "Processing..." : `Pay R ${estimatedCost.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
