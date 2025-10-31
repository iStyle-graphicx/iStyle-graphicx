import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, phone, phone_number } = body

    // Update profile
    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        phone: phone || phone_number,
        phone_number: phone_number || phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Get delivery statistics
    const { data: deliveries, error: deliveriesError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("customer_id", user.id)

    const stats = {
      total: deliveries?.length || 0,
      completed: deliveries?.filter((d) => d.status === "delivered").length || 0,
      pending:
        deliveries?.filter((d) => ["pending", "accepted", "picked_up", "in_transit"].includes(d.status)).length || 0,
      cancelled: deliveries?.filter((d) => d.status === "cancelled").length || 0,
    }

    // Get driver stats if user is a driver
    let driverStats = null
    if (profile.user_type === "driver") {
      const { data: driverData } = await supabase.from("drivers").select("*").eq("id", user.id).single()

      if (driverData) {
        driverStats = {
          total_deliveries: driverData.total_deliveries || 0,
          total_earnings: driverData.total_earnings || 0,
          rating: driverData.rating || 0,
          is_online: driverData.is_online || false,
        }
      }
    }

    return NextResponse.json({
      profile,
      stats,
      driverStats,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
