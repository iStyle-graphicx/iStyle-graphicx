"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface WhatsAppOTPRegistrationProps {
  onSuccess: () => void
  onBack: () => void
}

export function WhatsAppOTPRegistration({ onSuccess, onBack }: WhatsAppOTPRegistrationProps) {
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [expiresIn, setExpiresIn] = useState(0)

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number")
      return
    }

    // Validate phone number format
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      toast.error("Please enter a valid phone number in international format (e.g., +27123456789)")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send OTP")
        return
      }

      toast.success("OTP sent to your WhatsApp!")
      setExpiresIn(data.expiresIn)
      setStep("otp")
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP code")
      return
    }

    setStep("details")
  }

  const handleCompleteRegistration = async () => {
    if (!firstName || !lastName) {
      toast.error("Please enter your first and last name")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          otpCode,
          firstName,
          lastName,
          email: email || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to verify OTP")
        return
      }

      toast.success("Registration successful!")
      onSuccess()
    } catch (error) {
      toast.error("Failed to complete registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-6 w-6 text-[#FF6B00]" />
          <CardTitle>WhatsApp Registration</CardTitle>
        </div>
        <CardDescription>
          {step === "phone" && "Enter your phone number to receive an OTP via WhatsApp"}
          {step === "otp" && "Enter the 6-digit code sent to your WhatsApp"}
          {step === "details" && "Complete your profile information"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number in international format (e.g., +27 for South Africa)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1 bg-transparent">
                Back
              </Button>
              <Button onClick={handleSendOTP} disabled={loading} className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">Code expires in {Math.floor(expiresIn / 60)} minutes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("phone")} disabled={loading} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otpCode.length !== 6}
                className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <Button variant="link" onClick={handleSendOTP} disabled={loading} className="w-full text-[#FF6B00]">
              Resend OTP
            </Button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("otp")} disabled={loading} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCompleteRegistration}
                disabled={loading || !firstName || !lastName}
                className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
