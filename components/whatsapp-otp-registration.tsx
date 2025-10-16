"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
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
  const [devOTP, setDevOTP] = useState<string | null>(null)

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (expiresIn > 0 && step === "otp") {
      const timer = setInterval(() => {
        setExpiresIn((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [expiresIn, step])

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
    setDevOTP(null)

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

      // In development mode, show the OTP
      if (data.otp) {
        setDevOTP(data.otp)
        toast.success(`Development Mode: Your OTP is ${data.otp}`)
      } else {
        toast.success("OTP sent to your WhatsApp!")
      }

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
        setStep("otp") // Go back to OTP step
        return
      }

      toast.success("Registration successful! Please login with your credentials.")
      onSuccess()
    } catch (error) {
      toast.error("Failed to complete registration. Please try again.")
      setStep("otp")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full max-w-md mx-auto border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-6 w-6 text-[#FF6B00]" />
          <CardTitle className="text-white">WhatsApp Registration</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          {step === "phone" && "Enter your phone number to receive an OTP via WhatsApp"}
          {step === "otp" && "Enter the 6-digit code sent to your WhatsApp"}
          {step === "details" && "Complete your profile information"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400">
                Enter your phone number in international format (e.g., +27 for South Africa)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={loading}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700 bg-transparent"
              >
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
            {devOTP && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Development Mode</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Your OTP code is: <span className="font-mono font-bold">{devOTP}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-white">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="text-center text-2xl tracking-widest bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400">
                {expiresIn > 0 ? `Code expires in ${formatTime(expiresIn)}` : "Code expired"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("phone")}
                disabled={loading}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otpCode.length !== 6 || expiresIn === 0}
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
            <Button
              variant="link"
              onClick={handleSendOTP}
              disabled={loading || expiresIn > 540}
              className="w-full text-[#FF6B00] hover:text-[#FF6B00]/80"
            >
              {expiresIn > 540 ? "Wait before resending" : "Resend OTP"}
            </Button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400">If not provided, we'll create an email for you</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("otp")}
                disabled={loading}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
              >
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
