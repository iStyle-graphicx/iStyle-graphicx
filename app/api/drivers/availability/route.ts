import { createClient } from "@/lib/supabase/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, isOnline, location } = body

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Update driver availability
    const updateData: any = {
      is_online: isOnline,
      updated_at: new Date().toISOString(),
    }

    if (location) {
      updateData.current_lat = location.lat
      updateData.current_lng = location.lng
    }

    if (isOnline) {
      updateData.last_online_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from("drivers").update(updateData).eq("id", driverId).select().single()

    if (error) {
      console.error("Error updating driver availability:", error)
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
    }

    // Send notification to driver
    if (isOnline) {
      await supabase.from("notifications").insert({
        user_id: driverId,
        title: "You're Online",
        message: "You are now visible to customers and can receive delivery requests",
        type: "status_change",
        is_read: false,
      })
    }

    return NextResponse.json({ driver: data })
  } catch (error) {
    console.error("Error in driver availability API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") || "15" // Default 15km radius

    const supabase = createClient()

    // Fetch available drivers
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select(
        `
        *,
        profiles!inner(first_name, last_name, phone, avatar_url)
      `,
      )
      .eq("is_online", true)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching available drivers:", error)
      return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
    }

    // If location provided, calculate distances and filter by radius
    let filteredDrivers = drivers
    if (lat && lng) {
      const userLat = Number.parseFloat(lat)
      const userLng = Number.parseFloat(lng)
      const maxRadius = Number.parseFloat(radius)

      filteredDrivers = drivers
        .map((driver) => {
          if (!driver.current_lat || !driver.current_lng) return null

          // Calculate distance using Haversine formula
          const R = 6371 // Earth's radius in km
          const dLat = ((driver.current_lat - userLat) * Math.PI) / 180
          const dLng = ((driver.current_lng - userLng) * Math.PI) / 180
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((driver.current_lat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c

          return {
            ...driver,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          }
        })
        .filter((driver) => driver && driver.distance <= maxRadius)
        .sort((a, b) => (a?.distance || 0) - (b?.distance || 0))
    }

    return NextResponse.json({ drivers: filteredDrivers, count: filteredDrivers?.length || 0 })
  } catch (error) {
    console.error("Error in available drivers API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
