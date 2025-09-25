"use client"

import { useEffect, useRef, useState } from "react"
import { paymentService } from "@/lib/payment-service"
import type { PaymentRequest } from "@/lib/payment-config"
import { useToast } from "@/hooks/use-toast"

interface PayPalButtonProps {
  paymentRequest: PaymentRequest
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

export function PayPalButton({ paymentRequest, onSuccess, onError }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const initPayPal = async () => {
      try {
        await paymentService.loadPayPalSDK()

        if (paypalRef.current && (window as any).paypal) {
          ;(window as any).paypal
            .Buttons({
              createOrder: async () => {
                try {
                  const paymentId = await paymentService.createPayPalPayment(paymentRequest)
                  return paymentId
                } catch (error) {
                  console.error("PayPal order creation failed:", error)
                  onError("Failed to create PayPal payment")
                  throw error
                }
              },
              onApprove: async (data: any) => {
                try {
                  const response = await fetch("/api/payments/paypal/capture", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderID: data.orderID,
                      deliveryId: paymentRequest.deliveryId,
                    }),
                  })

                  const result = await response.json()
                  if (response.ok) {
                    onSuccess(result.paymentId)
                    toast({
                      title: "Payment Successful!",
                      description: "Your delivery payment has been processed.",
                    })

                    // Process driver payout (60% of total)
                    if (paymentRequest.driverId) {
                      const driverPayout = paymentService.calculateDriverPayout(paymentRequest.amount)
                      await paymentService.processDriverPayout(
                        paymentRequest.driverId,
                        driverPayout,
                        paymentRequest.deliveryId,
                      )
                    }
                  } else {
                    throw new Error(result.error || "Payment capture failed")
                  }
                } catch (error) {
                  console.error("PayPal capture failed:", error)
                  onError("Payment processing failed")
                }
              },
              onError: (err: any) => {
                console.error("PayPal error:", err)
                onError("PayPal payment failed")
              },
              style: {
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "paypal",
              },
            })
            .render(paypalRef.current)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("PayPal SDK loading failed:", error)
        onError("Failed to load PayPal")
        setIsLoading(false)
      }
    }

    initPayPal()
  }, [paymentRequest, onSuccess, onError, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-300">Loading PayPal...</span>
      </div>
    )
  }

  return <div ref={paypalRef} className="paypal-button-container" />
}
