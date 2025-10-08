"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Eye, EyeOff, Calendar, Download } from "lucide-react"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function ChangePasswordModal({ isOpen, onClose, userId }: ChangePasswordModalProps) {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onClose()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Change Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="text-white">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword" className="text-white">
              New Password
            </Label>
            <Input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-white">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface AddPaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onPaymentMethodAdded: () => void
}

export function AddPaymentMethodModal({ isOpen, onClose, userId, onPaymentMethodAdded }: AddPaymentMethodModalProps) {
  const { toast } = useToast()
  const [paymentType, setPaymentType] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [email, setEmail] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let details: any = {}

    if (paymentType === "mastercard" || paymentType === "visa") {
      details = {
        last4: cardNumber.slice(-4),
        expiry: expiryDate,
        cardholder_name: cardholderName,
      }
    } else if (paymentType === "paypal") {
      details = { email }
    } else if (paymentType === "bank_transfer") {
      details = { account: accountNumber }
    }

    const { error } = await supabase.from("payment_methods").insert({
      user_id: userId,
      type: paymentType,
      details,
      is_default: false,
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Payment method added successfully",
      })
      onPaymentMethodAdded()
      onClose()
      // Reset form
      setPaymentType("")
      setCardNumber("")
      setExpiryDate("")
      setCvv("")
      setCardholderName("")
      setEmail("")
      setAccountNumber("")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Payment Method
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="paymentType" className="text-white">
              Payment Type
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType} required>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(paymentType === "mastercard" || paymentType === "visa") && (
            <>
              <div>
                <Label htmlFor="cardNumber" className="text-white">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="1234 5678 9012 3456"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiryDate" className="text-white">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-white">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardholderName" className="text-white">
                  Cardholder Name
                </Label>
                <Input
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </>
          )}

          {paymentType === "paypal" && (
            <div>
              <Label htmlFor="email" className="text-white">
                PayPal Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          )}

          {paymentType === "bank_transfer" && (
            <div>
              <Label htmlFor="accountNumber" className="text-white">
                Account Number
              </Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !paymentType}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface BillingHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function BillingHistoryModal({ isOpen, onClose, userId }: BillingHistoryModalProps) {
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const fetchBillingHistory = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("billing_history")
      .select(`
        *,
        deliveries (
          pickup_address,
          delivery_address,
          item_description
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) setBillingHistory(data)
    setIsLoading(false)
  }

  const downloadReceipt = (transactionId: string) => {
    // Simulate receipt download
    const receiptData = `Receipt for Transaction: ${transactionId}\nDate: ${new Date().toLocaleDateString()}\nThank you for using Vango Delivery!`
    const blob = new Blob([receiptData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${transactionId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  React.useEffect(() => {
    if (isOpen) {
      fetchBillingHistory()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Billing History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading billing history...</div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No billing history found</div>
          ) : (
            billingHistory.map((bill) => (
              <div key={bill.id} className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">
                      {bill.deliveries?.item_description || "Delivery Service"}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {bill.deliveries?.pickup_address} → {bill.deliveries?.delivery_address}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(bill.created_at).toLocaleDateString()} • {bill.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">R{bill.amount}</p>
                    <p
                      className={`text-xs ${bill.payment_status === "completed" ? "text-green-400" : "text-yellow-400"}`}
                    >
                      {bill.payment_status}
                    </p>
                  </div>
                </div>

                {bill.transaction_id && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                    <span className="text-xs text-gray-400">Transaction ID: {bill.transaction_id}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReceipt(bill.transaction_id)}
                      className="border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Receipt
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
