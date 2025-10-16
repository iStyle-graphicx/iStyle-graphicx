import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { whatsappService } from "@/lib/whatsapp-service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    // Validate phone number
    if (!phoneNumber || !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use E.164 format (e.g., +27123456789)" },
        { status: 400 },
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if phone number is already registered
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone_number", phoneNumber)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 400 })
    }

    // Clean up old OTPs for this phone number
    await supabase.from("otp_codes").delete().eq("phone_number", phoneNumber)

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone_number: phoneNumber,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error("Error storing OTP:", insertError)
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
    }

    // Send OTP via WhatsApp
    const result = await whatsappService.sendOTP(phoneNumber, otpCode)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: 600, // 10 minutes in seconds
    })
  } catch (error) {
    console.error("Error in send-otp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
