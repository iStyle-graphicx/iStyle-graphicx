"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Shield, CheckCircle, AlertCircle, Clock, Phone, Mail, CreditCard } from "lucide-react"

interface ProfileVerificationStatusProps {
  userId: string
  userType: "customer" | "driver"
}

interface VerificationStatus {
  email_verified: boolean
  phone_verified: boolean
  identity_verified: boolean
  payment_verified: boolean
  driver_license_verified?: boolean
  vehicle_verified?: boolean
  background_check_verified?: boolean
}

export function ProfileVerificationStatus({ userId, userType }: ProfileVerificationStatusProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    email_verified: false,
    phone_verified: false,
    identity_verified: false,
    payment_verified: false,
    driver_license_verified: false,
    vehicle_verified: false,
    background_check_verified: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchVerificationStatus()
  }, [userId])

  const fetchVerificationStatus = async () => {
    try {
      const { data, error } = await supabase.from("user_verifications").select("*").eq("user_id", userId).single()

      if (data) {
        setVerificationStatus(data)
      } else if (error) {
        if (error.code === "PGRST116") {
          await createDefaultVerificationRecord()
        } else {
          console.error("Error fetching verification status:", error)
          toast({
            title: "Error",
            description: "Failed to load verification status",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive",
      })
    }
  }

  const createDefaultVerificationRecord = async () => {
    try {
      const { data, error } = await supabase
        .from("user_verifications")
        .insert({
          user_id: userId,
          email_verified: false,
          phone_verified: false,
          identity_verified: false,
          payment_verified: false,
          driver_license_verified: false,
          vehicle_verified: false,
          background_check_verified: false,
        })
        .select()
        .single()

      if (data) {
        setVerificationStatus(data)
      } else if (error) {
        console.error("Error creating verification record:", error)
      }
    } catch (error) {
      console.error("Error creating default verification record:", error)
    }
  }

  const sendVerificationEmail = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: (await supabase.auth.getUser()).data.user?.email || "",
      })

      if (error) throw error

      toast({
        title: "Verification email sent",
        description: "Please check your email and click the verification link",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const requestPhoneVerification = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would send an SMS verification code
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getVerificationIcon = (verified: boolean, pending?: boolean) => {
    if (verified) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (pending) return <Clock className="w-4 h-4 text-yellow-500" />
    return <AlertCircle className="w-4 h-4 text-red-500" />
  }

  const getVerificationBadge = (verified: boolean, pending?: boolean) => {
    if (verified) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Verified</Badge>
    if (pending) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Not Verified</Badge>
  }

  const customerVerifications = [
    {
      key: "email_verified",
      label: "Email Address",
      icon: Mail,
      action: sendVerificationEmail,
      actionLabel: "Send Verification Email",
    },
    {
      key: "phone_verified",
      label: "Phone Number",
      icon: Phone,
      action: requestPhoneVerification,
      actionLabel: "Verify Phone",
    },
    {
      key: "payment_verified",
      label: "Payment Method",
      icon: CreditCard,
      action: () => {},
      actionLabel: "Add Payment Method",
    },
  ]

  const driverVerifications = [
    ...customerVerifications,
    {
      key: "identity_verified",
      label: "Identity Document",
      icon: Shield,
      action: () => {},
      actionLabel: "Upload ID Document",
    },
    {
      key: "driver_license_verified",
      label: "Driver's License",
      icon: Shield,
      action: () => {},
      actionLabel: "Upload License",
    },
    {
      key: "vehicle_verified",
      label: "Vehicle Registration",
      icon: Shield,
      action: () => {},
      actionLabel: "Upload Registration",
    },
    {
      key: "background_check_verified",
      label: "Background Check",
      icon: Shield,
      action: () => {},
      actionLabel: "Complete Check",
    },
  ]

  const verifications = userType === "driver" ? driverVerifications : customerVerifications
  const completedCount = verifications.filter((v) => verificationStatus[v.key as keyof VerificationStatus]).length
  const totalCount = verifications.length
  const completionPercentage = Math.round((completedCount / totalCount) * 100)

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Account Verification
          <Badge className={`ml-auto ${completionPercentage === 100 ? "bg-green-500" : "bg-orange-500"}`}>
            {completedCount}/{totalCount}
          </Badge>
        </CardTitle>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              completionPercentage === 100 ? "bg-green-500" : "bg-orange-500"
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {verifications.map((verification) => {
          const isVerified = verificationStatus[verification.key as keyof VerificationStatus]
          const IconComponent = verification.icon

          return (
            <div key={verification.key} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white font-medium text-sm">{verification.label}</p>
                  {getVerificationBadge(isVerified)}
                </div>
              </div>
              {!isVerified && (
                <Button
                  onClick={verification.action}
                  disabled={isLoading}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                >
                  {verification.actionLabel}
                </Button>
              )}
            </div>
          )
        })}

        {userType === "driver" && completionPercentage < 100 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 font-medium text-sm">Driver Verification Required</p>
                <p className="text-yellow-200 text-xs mt-1">
                  Complete all verifications to start accepting delivery requests and earn money.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
