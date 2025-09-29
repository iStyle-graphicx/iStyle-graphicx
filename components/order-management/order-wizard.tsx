"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  MapPin,
  Package,
  Calendar,
  Clock,
  CreditCard,
  Smartphone,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Calculator,
} from "lucide-react"

interface OrderWizardProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onOrderCreated?: (orderId: string) => void
}

interface OrderData {
  // Step 1: Locations
  pickupAddress: string
  pickupLat?: number
  pickupLng?: number
  deliveryAddress: string
  deliveryLat?: number
  deliveryLng?: number

  // Step 2: Item Details
  itemDescription: string
  itemWeight: string
  itemSize: "small" | "medium" | "large" | "extra_large"
  materialType: string
  specialInstructions: string

  // Step 3: Scheduling
  deliveryType: "immediate" | "scheduled"
  scheduledDate?: string
  scheduledTime?: string
  priority: "standard" | "urgent" | "emergency"

  // Step 4: Payment
  paymentMethod: "mastercard" | "paypal" | "eft" | ""
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  paypalEmail?: string
  bankAccount?: string
  bankCode?: string
}

const STEPS = [
  { id: 1, title: "Locations", description: "Pickup and delivery addresses" },
  { id: 2, title: "Item Details", description: "What you're sending" },
  { id: 3, title: "Scheduling", description: "When to deliver" },
  { id: 4, title: "Payment", description: "Complete your order" },
]

const MATERIAL_TYPES = [
  { value: "cement", label: "Cement & Concrete", baseRate: 2.5 },
  { value: "bricks", label: "Bricks & Blocks", baseRate: 2.0 },
  { value: "timber", label: "Timber & Wood", baseRate: 1.8 },
  { value: "metal", label: "Metal Sheets & Pipes", baseRate: 3.0 },
  { value: "tools", label: "Tools & Equipment", baseRate: 1.5 },
  { value: "sand", label: "Sand & Gravel", baseRate: 2.2 },
  { value: "other", label: "Other Materials", baseRate: 2.0 },
]

const SIZE_MULTIPLIERS = {
  small: 1.0, // Up to 50kg
  medium: 1.3, // 50-150kg
  large: 1.6, // 150-500kg
  extra_large: 2.0, // 500kg+
}

const PRIORITY_MULTIPLIERS = {
  standard: 1.0,
  urgent: 1.5,
  emergency: 2.0,
}

export function OrderWizard({ isOpen, onClose, user, onOrderCreated }: OrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [orderData, setOrderData] = useState<OrderData>({
    pickupAddress: "",
    deliveryAddress: "",
    itemDescription: "",
    itemWeight: "",
    itemSize: "medium",
    materialType: "",
    specialInstructions: "",
    deliveryType: "immediate",
    priority: "standard",
    paymentMethod: "",
  })
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    calculateEstimatedCost()
  }, [orderData.itemWeight, orderData.materialType, orderData.itemSize, orderData.priority])

  const calculateEstimatedCost = () => {
    const weight = Number.parseFloat(orderData.itemWeight) || 0
    const material = MATERIAL_TYPES.find((m) => m.value === orderData.materialType)
    const baseRate = material?.baseRate || 2.0

    const baseCost = 50 // Base delivery fee
    const weightCost = weight * baseRate
    const sizeMultiplier = SIZE_MULTIPLIERS[orderData.itemSize]
    const priorityMultiplier = PRIORITY_MULTIPLIERS[orderData.priority]

    const total = (baseCost + weightCost) * sizeMultiplier * priorityMultiplier
    setEstimatedCost(Math.round(total * 100) / 100)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!orderData.pickupAddress) newErrors.pickupAddress = "Pickup address is required"
        if (!orderData.deliveryAddress) newErrors.deliveryAddress = "Delivery address is required"
        break
      case 2:
        if (!orderData.itemDescription) newErrors.itemDescription = "Item description is required"
        if (!orderData.itemWeight) newErrors.itemWeight = "Item weight is required"
        if (!orderData.materialType) newErrors.materialType = "Material type is required"
        break
      case 3:
        if (orderData.deliveryType === "scheduled") {
          if (!orderData.scheduledDate) newErrors.scheduledDate = "Scheduled date is required"
          if (!orderData.scheduledTime) newErrors.scheduledTime = "Scheduled time is required"
        }
        break
      case 4:
        if (!orderData.paymentMethod) newErrors.paymentMethod = "Payment method is required"
        if (orderData.paymentMethod === "mastercard") {
          if (!orderData.cardNumber) newErrors.cardNumber = "Card number is required"
          if (!orderData.expiryDate) newErrors.expiryDate = "Expiry date is required"
          if (!orderData.cvv) newErrors.cvv = "CVV is required"
        }
        if (orderData.paymentMethod === "paypal" && !orderData.paypalEmail) {
          newErrors.paypalEmail = "PayPal email is required"
        }
        if (orderData.paymentMethod === "eft") {
          if (!orderData.bankAccount) newErrors.bankAccount = "Bank account is required"
          if (!orderData.bankCode) newErrors.bankCode = "Bank code is required"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const submitOrder = async () => {
    if (!validateStep(4)) return

    setIsLoading(true)
    try {
      // Create delivery record
      const deliveryData = {
        customer_id: user.id,
        pickup_address: orderData.pickupAddress,
        pickup_lat: orderData.pickupLat,
        pickup_lng: orderData.pickupLng,
        delivery_address: orderData.deliveryAddress,
        delivery_lat: orderData.deliveryLat,
        delivery_lng: orderData.deliveryLng,
        item_description: orderData.itemDescription,
        item_weight: orderData.itemWeight,
        item_size: orderData.itemSize,
        delivery_fee: estimatedCost,
        payment_method: orderData.paymentMethod,
        payment_status: "paid",
        status: "pending",
        priority: orderData.priority,
        scheduled_date: orderData.deliveryType === "scheduled" ? orderData.scheduledDate : null,
        scheduled_time: orderData.deliveryType === "scheduled" ? orderData.scheduledTime : null,
        special_instructions: orderData.specialInstructions,
      }

      const { data, error } = await supabase.from("deliveries").insert(deliveryData).select().single()

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Order Created Successfully",
        message: `Your delivery order #${data.id.slice(0, 8)} has been created and is being processed.`,
        type: "success",
      })

      // Create billing record
      await supabase.from("billing_history").insert({
        user_id: user.id,
        delivery_id: data.id,
        amount: estimatedCost,
        payment_method: orderData.paymentMethod,
        payment_status: "completed",
        transaction_id: `TXN_${Date.now()}`,
      })

      toast({
        title: "Order Created Successfully!",
        description: `Your order #${data.id.slice(0, 8)} has been submitted and will be processed shortly.`,
      })

      onOrderCreated?.(data.id)
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Order Creation Failed",
        description: "There was an error creating your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setOrderData({
      pickupAddress: "",
      deliveryAddress: "",
      itemDescription: "",
      itemWeight: "",
      itemSize: "medium",
      materialType: "",
      specialInstructions: "",
      deliveryType: "immediate",
      priority: "standard",
      paymentMethod: "",
    })
    setEstimatedCost(0)
    setErrors({})
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupAddress" className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Pickup Address
              </Label>
              <Input
                id="pickupAddress"
                value={orderData.pickupAddress}
                onChange={(e) => setOrderData({ ...orderData, pickupAddress: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter pickup address"
                error={errors.pickupAddress}
              />
              {errors.pickupAddress && <p className="text-red-400 text-sm mt-1">{errors.pickupAddress}</p>}
            </div>

            <div>
              <Label htmlFor="deliveryAddress" className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </Label>
              <Input
                id="deliveryAddress"
                value={orderData.deliveryAddress}
                onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter delivery address"
                error={errors.deliveryAddress}
              />
              {errors.deliveryAddress && <p className="text-red-400 text-sm mt-1">{errors.deliveryAddress}</p>}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Address Tips</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Include building numbers and street names</li>
                <li>• Add landmarks for easier location</li>
                <li>• Specify floor/unit numbers if applicable</li>
              </ul>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="materialType" className="text-white flex items-center gap-2">
                <Package className="w-4 h-4" />
                Material Type
              </Label>
              <Select
                value={orderData.materialType}
                onValueChange={(value) => setOrderData({ ...orderData, materialType: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.materialType && <p className="text-red-400 text-sm mt-1">{errors.materialType}</p>}
            </div>

            <div>
              <Label htmlFor="itemDescription" className="text-white">
                Item Description
              </Label>
              <Input
                id="itemDescription"
                value={orderData.itemDescription}
                onChange={(e) => setOrderData({ ...orderData, itemDescription: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Describe the items to be delivered"
                error={errors.itemDescription}
              />
              {errors.itemDescription && <p className="text-red-400 text-sm mt-1">{errors.itemDescription}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemWeight" className="text-white">
                  Weight (kg)
                </Label>
                <Input
                  id="itemWeight"
                  type="number"
                  value={orderData.itemWeight}
                  onChange={(e) => setOrderData({ ...orderData, itemWeight: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                  min="1"
                  error={errors.itemWeight}
                />
                {errors.itemWeight && <p className="text-red-400 text-sm mt-1">{errors.itemWeight}</p>}
              </div>

              <div>
                <Label htmlFor="itemSize" className="text-white">
                  Size Category
                </Label>
                <Select
                  value={orderData.itemSize}
                  onValueChange={(value: any) => setOrderData({ ...orderData, itemSize: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="small">Small (up to 50kg)</SelectItem>
                    <SelectItem value="medium">Medium (50-150kg)</SelectItem>
                    <SelectItem value="large">Large (150-500kg)</SelectItem>
                    <SelectItem value="extra_large">Extra Large (500kg+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialInstructions" className="text-white">
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="specialInstructions"
                value={orderData.specialInstructions}
                onChange={(e) => setOrderData({ ...orderData, specialInstructions: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
                placeholder="Any special handling instructions..."
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" />
                Delivery Timing
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    orderData.deliveryType === "immediate"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-slate-600 bg-slate-700/50"
                  }`}
                  onClick={() => setOrderData({ ...orderData, deliveryType: "immediate" })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Immediate Delivery</h3>
                        <p className="text-sm text-gray-300">Start delivery as soon as possible</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    orderData.deliveryType === "scheduled"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-slate-600 bg-slate-700/50"
                  }`}
                  onClick={() => setOrderData({ ...orderData, deliveryType: "scheduled" })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Schedule Delivery</h3>
                        <p className="text-sm text-gray-300">Choose specific date and time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {orderData.deliveryType === "scheduled" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate" className="text-white">
                    Date
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={orderData.scheduledDate}
                    onChange={(e) => setOrderData({ ...orderData, scheduledDate: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min={new Date().toISOString().split("T")[0]}
                    error={errors.scheduledDate}
                  />
                  {errors.scheduledDate && <p className="text-red-400 text-sm mt-1">{errors.scheduledDate}</p>}
                </div>

                <div>
                  <Label htmlFor="scheduledTime" className="text-white">
                    Time
                  </Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={orderData.scheduledTime}
                    onChange={(e) => setOrderData({ ...orderData, scheduledTime: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    error={errors.scheduledTime}
                  />
                  {errors.scheduledTime && <p className="text-red-400 text-sm mt-1">{errors.scheduledTime}</p>}
                </div>
              </div>
            )}

            <div>
              <Label className="text-white mb-3 block">Priority Level</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "standard", label: "Standard", desc: "Normal delivery speed", multiplier: "1x" },
                  { value: "urgent", label: "Urgent", desc: "Faster delivery", multiplier: "1.5x" },
                  { value: "emergency", label: "Emergency", desc: "Immediate priority", multiplier: "2x" },
                ].map((priority) => (
                  <Card
                    key={priority.value}
                    className={`cursor-pointer transition-all ${
                      orderData.priority === priority.value
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-slate-600 bg-slate-700/50"
                    }`}
                    onClick={() => setOrderData({ ...orderData, priority: priority.value as any })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{priority.label}</h4>
                          <p className="text-xs text-gray-300">{priority.desc}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                          {priority.multiplier}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            {/* Order Summary */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">From:</span>
                    <span className="text-white text-right flex-1 ml-2 truncate">{orderData.pickupAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">To:</span>
                    <span className="text-white text-right flex-1 ml-2 truncate">{orderData.deliveryAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Item:</span>
                    <span className="text-white">
                      {orderData.itemDescription} ({orderData.itemWeight}kg)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Priority:</span>
                    <Badge variant="outline" className="text-orange-400 border-orange-400 capitalize">
                      {orderData.priority}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-orange-500">R {estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-white mb-3 block flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "mastercard", label: "Mastercard", icon: CreditCard },
                  { value: "paypal", label: "PayPal", icon: Smartphone },
                  { value: "eft", label: "EFT", icon: Building2 },
                ].map((method) => {
                  const Icon = method.icon
                  return (
                    <Card
                      key={method.value}
                      className={`cursor-pointer transition-all ${
                        orderData.paymentMethod === method.value
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-slate-600 bg-slate-700/50"
                      }`}
                      onClick={() => setOrderData({ ...orderData, paymentMethod: method.value as any })}
                    >
                      <CardContent className="p-3 text-center">
                        <Icon className="w-6 h-6 mx-auto mb-2 text-white" />
                        <p className="text-xs text-white">{method.label}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {errors.paymentMethod && <p className="text-red-400 text-sm mt-1">{errors.paymentMethod}</p>}
            </div>

            {/* Payment Details */}
            {orderData.paymentMethod === "mastercard" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber" className="text-white">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    value={orderData.cardNumber}
                    onChange={(e) => setOrderData({ ...orderData, cardNumber: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1234 5678 9012 3456"
                    error={errors.cardNumber}
                  />
                  {errors.cardNumber && <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate" className="text-white">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      value={orderData.expiryDate}
                      onChange={(e) => setOrderData({ ...orderData, expiryDate: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="MM/YY"
                      error={errors.expiryDate}
                    />
                    {errors.expiryDate && <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-white">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      value={orderData.cvv}
                      onChange={(e) => setOrderData({ ...orderData, cvv: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="123"
                      error={errors.cvv}
                    />
                    {errors.cvv && <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {orderData.paymentMethod === "paypal" && (
              <div>
                <Label htmlFor="paypalEmail" className="text-white">
                  PayPal Email
                </Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={orderData.paypalEmail}
                  onChange={(e) => setOrderData({ ...orderData, paypalEmail: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="your@email.com"
                  error={errors.paypalEmail}
                />
                {errors.paypalEmail && <p className="text-red-400 text-sm mt-1">{errors.paypalEmail}</p>}
              </div>
            )}

            {orderData.paymentMethod === "eft" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bankAccount" className="text-white">
                    Bank Account Number
                  </Label>
                  <Input
                    id="bankAccount"
                    value={orderData.bankAccount}
                    onChange={(e) => setOrderData({ ...orderData, bankAccount: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1234567890"
                    error={errors.bankAccount}
                  />
                  {errors.bankAccount && <p className="text-red-400 text-sm mt-1">{errors.bankAccount}</p>}
                </div>
                <div>
                  <Label htmlFor="bankCode" className="text-white">
                    Bank Code
                  </Label>
                  <Input
                    id="bankCode"
                    value={orderData.bankCode}
                    onChange={(e) => setOrderData({ ...orderData, bankCode: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="123456"
                    error={errors.bankCode}
                  />
                  {errors.bankCode && <p className="text-red-400 text-sm mt-1">{errors.bankCode}</p>}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">Create New Order</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.id ? "bg-orange-500 text-white" : "bg-slate-600 text-gray-400"
                }`}
              >
                {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? "bg-orange-500" : "bg-slate-600"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white">{STEPS[currentStep - 1].title}</h3>
            <p className="text-sm text-gray-400">{STEPS[currentStep - 1].description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Cost Display */}
        {estimatedCost > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/20 mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Estimated Cost:</span>
                <span className="text-orange-500 text-xl font-bold">R {estimatedCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitOrder}
              disabled={isLoading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? "Creating Order..." : `Create Order - R ${estimatedCost.toFixed(2)}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
