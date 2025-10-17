import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        customer:profiles!deliveries_customer_id_fkey(id, first_name, last_name, phone, avatar_url),
        driver:profiles!deliveries_driver_id_fkey(id, first_name, last_name, phone, avatar_url)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching delivery:", error)
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    return NextResponse.json({ delivery })
  } catch (error: any) {
    console.error("Error in get delivery API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, driverId, rating, review } = body

    const supabase = createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (driverId) updateData.driver_id = driverId
    if (rating !== undefined) updateData.rating = rating
    if (review) updateData.review = review

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating delivery:", error)
      return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 })
    }

    // Send notifications based on status change
    if (status) {
      let notificationTitle = ""
      let notificationMessage = ""

      switch (status) {
        case "accepted":
          notificationTitle = "Driver Assigned"
          notificationMessage = "A driver has been assigned to your delivery"
          break
        case "picked_up":
          notificationTitle = "Package Picked Up"
          notificationMessage = "Your package has been picked up and is on the way"
          break
        case "in_transit":
          notificationTitle = "Delivery In Transit"
          notificationMessage = "Your package is currently being delivered"
          break
        case "delivered":
          notificationTitle = "Delivery Complete"
          notificationMessage = "Your package has been successfully delivered"
          break
        case "cancelled":
          notificationTitle = "Delivery Cancelled"
          notificationMessage = "Your delivery has been cancelled"
          break
      }

      if (notificationTitle && delivery.customer_id) {
        await supabase.from("notifications").insert({
          user_id: delivery.customer_id,
          title: notificationTitle,
          message: notificationMessage,
          type: "delivery",
          is_read: false,
        })
      }
    }

    return NextResponse.json({ delivery, success: true })
  } catch (error: any) {
    console.error("Error in update delivery API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
