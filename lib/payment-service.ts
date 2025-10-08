import { PAYPAL_CONFIG, type PaymentRequest } from "./payment-config"

export class PaymentService {
  private static instance: PaymentService
  private paypalLoaded = false

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  async loadPayPalSDK(): Promise<void> {
    if (this.paypalLoaded) return

    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&currency=ZAR&components=buttons,marks`
      script.onload = () => {
        this.paypalLoaded = true
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async createPayPalPayment(paymentRequest: PaymentRequest): Promise<string> {
    try {
      const response = await fetch("/api/payments/paypal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal payment")
      }

      return data.paymentId
    } catch (error) {
      console.error("PayPal payment creation failed:", error)
      throw error
    }
  }

  async processEFTPayment(paymentRequest: PaymentRequest, bankCode: string): Promise<string> {
    try {
      const response = await fetch("/api/payments/eft/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...paymentRequest,
          bankCode,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create EFT payment")
      }

      return data.paymentReference
    } catch (error) {
      console.error("EFT payment creation failed:", error)
      throw error
    }
  }

  calculateDriverPayout(totalAmount: number): number {
    return Math.round(totalAmount * 0.6 * 100) / 100 // 60% to driver
  }

  calculatePlatformFee(totalAmount: number): number {
    return Math.round(totalAmount * 0.4 * 100) / 100 // 40% platform fee
  }

  async processDriverPayout(driverId: string, amount: number, deliveryId: string): Promise<void> {
    try {
      await fetch("/api/payments/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId,
          amount,
          deliveryId,
          currency: "ZAR",
        }),
      })
    } catch (error) {
      console.error("Driver payout failed:", error)
      throw error
    }
  }
}

export const paymentService = PaymentService.getInstance()
