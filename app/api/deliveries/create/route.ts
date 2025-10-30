import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      itemDescription,
      itemSize,
      itemWeight,
      deliveryFee,
      distanceKm,
      paymentMethod,
    } = body

    if (!pickupAddress || !deliveryAddress || !itemDescription || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        customer_id: user.id,
        pickup_address: pickupAddress,
        pickup_lat: pickupLat || null,
        pickup_lng: pickupLng || null,
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat || null,
        delivery_lng: deliveryLng || null,
        item_description: itemDescription,
        item_size: itemSize || "medium",
        item_weight: itemWeight || "light",
        delivery_fee: deliveryFee || 0,
        distance_km: distanceKm || 0,
        payment_method: paymentMethod,
        payment_status: "pending",
        status: "pending",
      })
      .select()
      .single()

    if (deliveryError) {
      console.error("[v0] Delivery creation error:", deliveryError)
      return NextResponse.json({ error: "Failed to create delivery", details: deliveryError.message }, { status: 500 })
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Delivery Request Created",
      message: `Your delivery request has been created. We're finding the best driver for you.`,
      type: "delivery",
      is_read: false,
    })

    const { data: availableDrivers } = await supabase
      .from("drivers")
      .select("id")
      .eq("is_online", true)
      .eq("status", "active")
      .limit(10)

    if (availableDrivers && availableDrivers.length > 0) {
      const driverNotifications = availableDrivers.map((driver) => ({
        user_id: driver.id,
        title: "New Delivery Request",
        message: `${itemDescription} - R${deliveryFee} (${distanceKm?.toFixed(1) || 0}km)`,
        type: "delivery_request",
        is_read: false,
      }))

      await supabase.from("notifications").insert(driverNotifications)
    }

    return NextResponse.json({ delivery, success: true })
  } catch (error: any) {
    console.error("[v0] Error in create delivery API:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
