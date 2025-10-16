// WhatsApp OTP Service using Twilio
// This service handles sending OTP codes via WhatsApp

interface WhatsAppConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string
}

interface SendOTPResult {
  success: boolean
  message: string
  sid?: string
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null
  private isDevelopment = false

  constructor() {
    // Initialize Twilio configuration from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    // Check if running in development mode (localhost)
    this.isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost"

    if (accountSid && authToken && whatsappNumber) {
      this.config = {
        accountSid,
        authToken,
        whatsappNumber,
      }
    }
  }

  async sendOTP(phoneNumber: string, otpCode: string): Promise<SendOTPResult> {
    // Validate phone number format (E.164)
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return {
        success: false,
        message: "Invalid phone number format. Use E.164 format (e.g., +27123456789)",
      }
    }

    // Check if Twilio is configured
    if (!this.config) {
      // In development, return success but log the OTP
      if (this.isDevelopment) {
        console.info(`[WhatsApp OTP] Development mode - OTP for ${phoneNumber}: ${otpCode}`)
        return {
          success: true,
          message: `Development mode: OTP is ${otpCode}`,
          sid: "dev_mode",
        }
      }
      return {
        success: false,
        message: "WhatsApp service not configured. Please add Twilio credentials.",
      }
    }

    try {
      // Send WhatsApp message via Twilio
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString(
              "base64",
            )}`,
          },
          body: new URLSearchParams({
            From: `whatsapp:${this.config.whatsappNumber}`,
            To: `whatsapp:${phoneNumber}`,
            Body: `Your VanGo verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`,
          }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        console.error("Twilio API error:", error)
        return {
          success: false,
          message: error.message || "Failed to send OTP via WhatsApp",
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: "OTP sent successfully",
        sid: data.sid,
      }
    } catch (error) {
      console.error("Error sending WhatsApp OTP:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send OTP",
      }
    }
  }

  isConfigured(): boolean {
    return this.config !== null || this.isDevelopment
  }

  isDevelopmentMode(): boolean {
    return this.isDevelopment
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()
