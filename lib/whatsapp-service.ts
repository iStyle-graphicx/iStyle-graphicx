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
  developmentMode?: boolean
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null
  private isDevelopment = false
  private configError: string | null = null

  constructor() {
    // Check if running in development mode (localhost or no window)
    this.isDevelopment = typeof window === "undefined" || window.location.hostname === "localhost"

    // Initialize Twilio configuration from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    // Validate Twilio credentials
    if (accountSid && authToken && whatsappNumber) {
      if (!accountSid.startsWith("AC")) {
        this.configError = `Invalid Twilio Account SID. It should start with "AC", but got "${accountSid.substring(0, 2)}...". Please check your TWILIO_ACCOUNT_SID environment variable.`
        console.error(this.configError)
      } else if (authToken.length < 32) {
        this.configError = "Invalid Twilio Auth Token. It should be at least 32 characters long."
        console.error(this.configError)
      } else {
        this.config = {
          accountSid,
          authToken,
          whatsappNumber,
        }
      }
    } else {
      this.configError =
        "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables."
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

    if (!this.config || this.configError) {
      if (this.isDevelopment) {
        console.info(`[WhatsApp OTP] Development mode - OTP for ${phoneNumber}: ${otpCode}`)
        return {
          success: true,
          message: `Development mode: Your OTP is ${otpCode}`,
          sid: "dev_mode",
          developmentMode: true,
        }
      }
      return {
        success: false,
        message: this.configError || "WhatsApp service not configured. Please add valid Twilio credentials.",
      }
    }

    try {
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
            From: `whatsapp:+13613061135`,
            To: `whatsapp:${phoneNumber}`,
            Body: `Your VanGo verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`,
          }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        console.error("Twilio API error:", error)

        let userMessage = "Failed to send OTP via WhatsApp"
        if (error.code === 20003) {
          userMessage = "Invalid Twilio credentials. Please check your Account SID and Auth Token."
        } else if (error.code === 21211) {
          userMessage = "Invalid phone number. Please check the number and try again."
        } else if (error.code === 21608) {
          userMessage = "WhatsApp is not enabled for this Twilio number. Please enable it in your Twilio console."
        }

        return {
          success: false,
          message: userMessage,
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: "OTP sent successfully via WhatsApp",
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
    return this.isDevelopment && !this.config
  }

  getConfigError(): string | null {
    return this.configError
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()
