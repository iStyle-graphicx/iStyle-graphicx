import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message, to, timestamp } = body

    // In a real application, you would integrate with an email service
    // like SendGrid, Mailgun, or AWS SES to send emails to info@vango.co.za

    console.log("Contact form submission:", {
      to: "info@vango.co.za",
      from: email,
      name,
      phone,
      subject,
      message,
      timestamp,
    })

    // For now, we'll simulate a successful email send
    // In production, replace this with actual email sending logic

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 })
  }
}
