import { type NextRequest, NextResponse } from "next/server"
import { SA_BANKS } from "@/lib/payment-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "ZAR", description, deliveryId, bankCode } = body

    // Find the selected bank
    const selectedBank = SA_BANKS.find((bank) => bank.code === bankCode.toUpperCase())
    if (!selectedBank) {
      throw new Error("Invalid bank code")
    }

    // Generate payment reference
    const paymentReference = `VG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // In a real application, you would integrate with South African payment gateways
    // like PayGate, PayFast, or Ozow for EFT processing

    // For now, we'll simulate the EFT payment creation
    const eftPayment = {
      reference: paymentReference,
      amount: amount,
      currency: currency,
      bank: selectedBank.name,
      bankCode: selectedBank.code,
      description: description,
      deliveryId: deliveryId,
      status: "pending",
      instructions: {
        accountName: "VanGo Delivery Services",
        accountNumber: "1234567890",
        branchCode: "250655",
        reference: paymentReference,
        amount: `R${amount.toFixed(2)}`,
      },
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    // Store payment details in database
    console.log("EFT payment created:", eftPayment)

    return NextResponse.json({
      paymentReference: paymentReference,
      status: "pending",
      instructions: eftPayment.instructions,
      expiryTime: eftPayment.expiryTime,
    })
  } catch (error) {
    console.error("EFT payment creation error:", error)
    return NextResponse.json({ error: "Failed to create EFT payment" }, { status: 500 })
  }
}
