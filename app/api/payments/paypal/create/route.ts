import { type NextRequest, NextResponse } from "next/server"
import { PAYPAL_CONFIG } from "@/lib/payment-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "ZAR", description, deliveryId } = body

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

    // Create PayPal order
    const orderResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: description,
            custom_id: deliveryId,
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
        },
      }),
    })

    const orderData = await orderResponse.json()
    if (!orderResponse.ok) {
      throw new Error("Failed to create PayPal order")
    }

    return NextResponse.json({
      paymentId: orderData.id,
      status: orderData.status,
    })
  } catch (error) {
    console.error("PayPal payment creation error:", error)
    return NextResponse.json({ error: "Failed to create PayPal payment" }, { status: 500 })
  }
}
