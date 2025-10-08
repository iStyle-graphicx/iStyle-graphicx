"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const { toast } = useToast()

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        throw new Error("No email found")
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) throw error

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox and spam folder.",
      })
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  if (!isVisible) return null

  return (
    <Alert className="bg-orange-500/10 border-orange-500/50 mb-4">
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-500">Email verification required</p>
          <p className="text-xs text-gray-300 mt-1">Please verify your email address to access all features.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent"
          >
            <Mail className="h-3 w-3 mr-1" />
            {isResending ? "Sending..." : "Resend"}
          </Button>
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
