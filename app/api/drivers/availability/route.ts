import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, isOnline, location } = body

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Update driver availability
    const updateData: Record<string, unknown> = {
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
        type: "info",
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
    const radius = searchParams.get("radius") || "15"

    const supabase = getServiceClient()

    // Fetch all drivers with their status (both online and busy)
    const { data: allDrivers, error: allError } = await supabase
      .from("drivers")
      .select(
        `
        *,
        profiles!inner(first_name, last_name, phone, avatar_url)
      `,
      )
      .eq("status", "active")

    if (allError) {
      console.error("Error fetching drivers:", allError)
      return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
    }

    // Fetch currently active deliveries to determine which drivers are busy
    const { data: activeDeliveries } = await supabase
      .from("deliveries")
      .select("driver_id")
      .in("status", ["accepted", "picked_up", "in_transit"])
      .not("driver_id", "is", null)

    const busyDriverIds = new Set((activeDeliveries || []).map((d) => d.driver_id))

    // Enrich drivers with availability status
    const enrichedDrivers = (allDrivers || [])
      .filter((driver) => driver.is_online)
      .map((driver) => ({
        ...driver,
        is_busy: busyDriverIds.has(driver.id),
        availability_status: busyDriverIds.has(driver.id) ? "busy" : "available",
      }))

    // If location provided, calculate distances and filter by radius
    let filteredDrivers = enrichedDrivers
    if (lat && lng) {
      const userLat = Number.parseFloat(lat)
      const userLng = Number.parseFloat(lng)
      const maxRadius = Number.parseFloat(radius)

      filteredDrivers = enrichedDrivers
        .map((driver) => {
          if (!driver.current_lat || !driver.current_lng) return null

          const R = 6371
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
            distance: Math.round(distance * 10) / 10,
          }
        })
        .filter((driver): driver is NonNullable<typeof driver> => driver !== null && driver.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance)
    }

    const availableCount = filteredDrivers.filter((d) => d.availability_status === "available").length
    const busyCount = filteredDrivers.filter((d) => d.availability_status === "busy").length

    return NextResponse.json({
      drivers: filteredDrivers,
      count: filteredDrivers.length,
      availableCount,
      busyCount,
    })
  } catch (error) {
    console.error("Error in available drivers API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
