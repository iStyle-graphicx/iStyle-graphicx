"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { SA_BANKS, type PaymentMethod } from "@/lib/payment-config"
import { CreditCard, Building2, Smartphone, Plus, Check } from "lucide-react"

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onMethodSelect: (methodId: string) => void
  onAddMethod: () => void
  amount: number
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  onAddMethod,
  amount,
}: PaymentMethodSelectorProps) {
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "paypal",
      type: "paypal",
      name: "PayPal",
      details: "Pay securely with PayPal",
      isDefault: true,
    },
    {
      id: "eft-absa",
      type: "eft",
      name: "ABSA EFT",
      details: "Electronic Funds Transfer",
      isDefault: false,
    },
    {
      id: "card-1234",
      type: "card",
      name: "Mastercard",
      details: "**** **** **** 1234",
      isDefault: false,
    },
  ])

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "paypal":
        return <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">PP</div>
      case "eft":
        return <Building2 className="w-6 h-6 text-green-600" />
      case "card":
        return <CreditCard className="w-6 h-6 text-purple-600" />
      default:
        return <Smartphone className="w-6 h-6 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Payment Method</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-500">R{amount.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Total Amount</div>
        </div>
      </div>

      <RadioGroup value={selectedMethod} onValueChange={onMethodSelect} className="space-y-3">
        {paymentMethods.map((method) => (
          <div key={method.id} className="relative">
            <Label
              htmlFor={method.id}
              className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-orange-500/50 cursor-pointer transition-colors"
            >
              <RadioGroupItem value={method.id} id={method.id} className="text-orange-500" />
              <div className="flex items-center space-x-3 flex-1">
                {getMethodIcon(method.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{method.name}</span>
                    {method.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{method.details}</p>
                </div>
              </div>
              {selectedMethod === method.id && <Check className="w-5 h-5 text-orange-500" />}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* South African Banks EFT Options */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <h4 className="font-medium text-white mb-3">Available EFT Banks</h4>
          <div className="grid grid-cols-2 gap-2">
            {SA_BANKS.map((bank) => (
              <Button
                key={bank.code}
                variant="outline"
                size="sm"
                className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
                onClick={() => onMethodSelect(`eft-${bank.code.toLowerCase()}`)}
              >
                <Building2 className="w-4 h-4 mr-2" style={{ color: bank.color }} />
                {bank.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={onAddMethod}
        className="w-full border-slate-600 text-gray-300 hover:bg-slate-800 bg-transparent"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Payment Method
      </Button>

      {/* Payment Security Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-sm text-blue-300">
          🔒 All payments are secured with 256-bit SSL encryption. Your financial information is never stored on our
          servers.
        </p>
      </div>
    </div>
  )
}
