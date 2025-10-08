import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, documents } = await request.json()

    if (!userId || !documents) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Store documents in a JSONB column or create a documents table
    // For now, we'll use a simple approach with notifications
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "driver_verification",
      title: "Documents Submitted",
      message: "Your documents have been submitted for verification",
      is_read: false,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Submit documents error:", error)
    return NextResponse.json({ error: "Failed to submit documents" }, { status: 500 })
  }
}
