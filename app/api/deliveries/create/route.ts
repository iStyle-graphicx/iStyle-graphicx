import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      packageSize,
      packageWeight,
      packageDescription,
      recipientName,
      recipientPhone,
      deliveryInstructions,
      paymentMethod,
      estimatedPrice,
    } = body

    // Validate required fields
    if (
      !customerId ||
      !pickupAddress ||
      !deliveryAddress ||
      !packageSize ||
      !recipientName ||
      !recipientPhone ||
      !paymentMethod
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Create delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        customer_id: customerId,
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        package_size: packageSize,
        package_weight: packageWeight,
        package_description: packageDescription,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_instructions: deliveryInstructions,
        payment_method: paymentMethod,
        price: estimatedPrice,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (deliveryError) {
      console.error("Error creating delivery:", deliveryError)
      return NextResponse.json({ error: "Failed to create delivery", details: deliveryError.message }, { status: 500 })
    }

    // Create notification for customer
    await supabase.from("notifications").insert({
      user_id: customerId,
      title: "Delivery Request Created",
      message: `Your delivery request from ${pickupAddress} to ${deliveryAddress} has been created and is awaiting driver assignment.`,
      type: "delivery",
      is_read: false,
    })

    return NextResponse.json({ delivery, success: true })
  } catch (error: any) {
    console.error("Error in create delivery API:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
