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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (type === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          })
        } else if (data.user) {
          toast({
            title: "Login successful!",
            description: "Welcome back to Vango Delivery",
          })
          onSuccess()
          onClose()
        }
      } else {
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
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          })
        } else {
          if (data.user) {
            try {
              const { error: profileError } = await supabase.from("profiles").insert({
                id: data.user.id,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                user_type: formData.userType,
              })

              if (profileError) {
                console.error("[v0] Profile creation error:", profileError)
              }
            } catch (profileError) {
              console.error("[v0] Profile creation error:", profileError)
            }
          }

          toast({
            title: "Registration successful!",
            description: "Please check your email to confirm your account before you can start using Vango Delivery.",
          })
          onClose()
        }
      }
    } catch (error) {
      console.error("[v0] Auth error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src="/images/vango-logo-new.svg" alt="Vango Delivery" className="h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            {type === "login" ? "Login to Vango" : "Join Vango Delivery"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder={type === "login" ? "Your password" : "Create a secure password"}
              required
              minLength={6}
            />
          </div>

          {type === "register" && (
            <div>
              <Label htmlFor="userType" className="text-white">
                I want to:
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
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
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : type === "login" ? "Login" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-300">
          {type === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={type === "login" ? onSwitchToRegister : onSwitchToLogin}
            className="text-orange-500 font-semibold hover:underline"
          >
            {type === "login" ? "Register" : "Login"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
