import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otpCode, firstName, lastName, email } = await request.json()

    // Validate inputs
    if (!phoneNumber || !otpCode) {
      return NextResponse.json({ error: "Phone number and OTP code are required" }, { status: 400 })
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Retrieve OTP from database
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Check if OTP has expired
    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= otpData.max_attempts) {
      return NextResponse.json({ error: "Maximum verification attempts exceeded" }, { status: 400 })
    }

    // Verify OTP
    if (otpData.otp_code !== otpCode) {
      // Increment attempts
      await supabase
        .from("otp_codes")
        .update({ attempts: otpData.attempts + 1 })
        .eq("id", otpData.id)

      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 })
    }

    // OTP is valid - create user account
    // Generate a random password for the user (they can reset it later)
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

    // Create auth user with email (use phone number as email if not provided)
    const userEmail = email || `${phoneNumber.replace("+", "")}@vango.app`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        registration_method: "whatsapp",
      },
    })

    if (authError || !authData.user) {
      console.error("Error creating user:", authError)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    // Update profile with phone number
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Error updating profile:", profileError)
    }

    // Mark OTP as verified
    await supabase.from("otp_codes").update({ verified: true }).eq("id", otpData.id)

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    })

    if (sessionError) {
      console.error("Error generating session:", sessionError)
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: authData.user.id,
        email: userEmail,
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
      },
    })
  } catch (error) {
    console.error("Error in verify-otp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
