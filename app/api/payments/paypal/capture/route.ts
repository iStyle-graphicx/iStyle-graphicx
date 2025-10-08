import { type NextRequest, NextResponse } from "next/server"
import { PAYPAL_CONFIG } from "@/lib/payment-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderID, deliveryId } = body

    // Get PayPal access token
    const tokenResponse = await fetch(`https://api-m.paypal.com/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) {
      throw new Error("Failed to get PayPal access token")
    }

    // Capture PayPal payment
    const captureResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const captureData = await captureResponse.json()
    if (!captureResponse.ok) {
      throw new Error("Failed to capture PayPal payment")
    }

    // Update delivery status in database
    // In a real app, you would update your database here
    console.log("Payment captured for delivery:", deliveryId, captureData)

    return NextResponse.json({
      paymentId: captureData.id,
      status: captureData.status,
      amount: captureData.purchase_units[0].payments.captures[0].amount,
    })
  } catch (error) {
    console.error("PayPal payment capture error:", error)
    return NextResponse.json({ error: "Failed to capture PayPal payment" }, { status: 500 })
  }
}
