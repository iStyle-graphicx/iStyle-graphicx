"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { OrderWizard } from "@/components/order-management/order-wizard"
import { UserPlus, AlertCircle } from "lucide-react"

interface RequestDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  onShowAuth?: () => void
}

export function RequestDeliveryModal({ isOpen, onClose, onShowAuth }: RequestDeliveryModalProps) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("vangoUser")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const canRequestDelivery = user && user.userType === "customer"
  const isGuest = !user || user.userType === "guest"
  const isDriver = user && user.userType === "driver"

  if (canRequestDelivery) {
    return (
      <OrderWizard
        isOpen={isOpen}
        onClose={onClose}
        user={user}
        onOrderCreated={(orderId) => {
          console.log("Order created:", orderId)
        }}
      />
    )
  }

  if (isGuest) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <img src="/images/vango-logo-new.svg" alt="Vango Delivery" className="h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-white">Registration Required</DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <UserPlus className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Create Your Account</h3>
              <p className="text-gray-300 text-sm">
                To request deliveries, you need to create a customer account. This helps us provide better service and
                track your orders.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  onClose()
                  onShowAuth?.()
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
              >
                Create Customer Account
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isDriver) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <img src="/images/vango-logo-new.svg" alt="Vango Delivery" className="h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-white">Driver Account Detected</DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">You're a Driver!</h3>
              <p className="text-gray-300 text-sm">
                Driver accounts are for accepting and completing deliveries. To request deliveries, you'll need a
                separate customer account.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  onClose()
                  onShowAuth?.()
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
              >
                Create Customer Account
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                Continue as Driver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
