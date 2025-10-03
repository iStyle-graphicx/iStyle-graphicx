"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

interface AuthModalProps {
  type: "login" | "register"
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSwitchToRegister?: () => void
  onSwitchToLogin?: () => void
}

export function AuthModal({ type, isOpen, onClose, onSuccess, onSwitchToRegister, onSwitchToLogin }: AuthModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    userType: "customer",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" }
    if (password.length < 6) return { strength: 1, label: "Too short", color: "text-red-500" }
    if (password.length < 8) return { strength: 2, label: "Weak", color: "text-orange-500" }

    let strength = 2
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength === 3) return { strength: 3, label: "Good", color: "text-yellow-500" }
    if (strength >= 4) return { strength: 4, label: "Strong", color: "text-green-500" }
    return { strength: 2, label: "Weak", color: "text-orange-500" }
  }

  const passwordStrength = type === "register" ? getPasswordStrength(formData.password) : null

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset email sent!",
        description: "Check your email for a link to reset your password.",
      })
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: any): string => {
    const message = error?.message || ""

    if (message.includes("User already registered")) {
      return "This email is already registered. Try logging in instead."
    }
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again."
    }
    if (message.includes("Email not confirmed")) {
      return "Please verify your email address before logging in. Check your inbox for the verification link."
    }
    if (message.includes("Password should be at least")) {
      return "Password must be at least 6 characters long."
    }
    if (message.includes("Unable to validate email")) {
      return "Please enter a valid email address."
    }

    return message || "An unexpected error occurred. Please try again."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (type === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setError(getErrorMessage(error))
          toast({
            title: "Login failed",
            description: getErrorMessage(error),
            variant: "destructive",
          })
          return
        }

        if (data.user) {
          toast({
            title: "Login successful!",
            description: "Welcome back to VanGo Delivery",
          })
          onSuccess()
          onClose()
        }
      } else {
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long for better security.")
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              user_type: formData.userType,
            },
          },
        })

        if (error) {
          setError(getErrorMessage(error))
          toast({
            title: "Registration failed",
            description: getErrorMessage(error),
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account before logging in.",
          duration: 6000,
        })

        if (onSwitchToLogin) {
          setTimeout(() => {
            onClose()
            onSwitchToLogin()
          }, 2000)
        } else {
          onClose()
        }
      }
    } catch (error) {
      console.error("[v0] Auth error:", error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">Reset Password</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="reset-email" className="text-white">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="your.email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src="/images/vango-logo-new.svg" alt="VanGo Delivery" className="h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            {type === "login" ? "Login to VanGo" : "Join VanGo Delivery"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {type === "register" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="firstName" className="text-white">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="First name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Last name"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="+27 123 456 789"
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setError(null)
              }}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="your.email@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  setError(null)
                }}
                className="bg-slate-700 border-slate-600 text-white pr-10"
                placeholder={type === "login" ? "Your password" : "Create a secure password (min 8 characters)"}
                required
                minLength={type === "register" ? 8 : 6}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {type === "register" && formData.password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength === 1
                          ? "bg-red-500 w-1/4"
                          : passwordStrength.strength === 2
                            ? "bg-orange-500 w-2/4"
                            : passwordStrength.strength === 3
                              ? "bg-yellow-500 w-3/4"
                              : "bg-green-500 w-full"
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>{passwordStrength.label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Use 8+ characters with uppercase, numbers, and symbols for a strong password
                </p>
              </div>
            )}

            {type === "login" && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-orange-500 hover:underline mt-1 block"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            )}
          </div>

          {type === "register" && (
            <div>
              <Label htmlFor="userType" className="text-white">
                I want to:
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="customer">Request deliveries (Customer)</SelectItem>
                  <SelectItem value="driver">Deliver packages (Driver)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.userType === "customer"
                  ? "Order deliveries and track your packages"
                  : "Join our driver network and earn money"}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
            disabled={isLoading || (type === "register" && passwordStrength && passwordStrength.strength < 2)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {type === "login" ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              <>{type === "login" ? "Login" : "Create Account"}</>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-300">
          {type === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={type === "login" ? onSwitchToRegister : onSwitchToLogin}
            className="text-orange-500 font-semibold hover:underline"
            disabled={isLoading}
          >
            {type === "login" ? "Register" : "Login"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
