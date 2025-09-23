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
    name: "",
    email: "",
    password: "",
    userType: "customer",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
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
          // Fetch user profile
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: profile ? `${profile.first_name} ${profile.last_name}` : formData.name,
            userType: profile?.user_type || "customer",
            joinDate: data.user.created_at,
          }

          localStorage.setItem("vangoUser", JSON.stringify(userData))

          toast({
            title: "Login successful!",
            description: "Welcome back to VanGo",
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
              first_name: formData.name.split(" ")[0] || "",
              last_name: formData.name.split(" ").slice(1).join(" ") || "",
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
          toast({
            title: "Registration successful!",
            description: "Please check your email to confirm your account",
          })
          onClose()
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
          <DialogTitle className="text-2xl font-bold text-center text-white">
            {type === "login" ? "Login to VanGo" : "Create an Account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "register" && (
            <div>
              <Label htmlFor="name" className="text-white">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Your name"
                required
              />
            </div>
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
              placeholder="Your email"
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
              placeholder={type === "login" ? "Your password" : "Create a password"}
              required
              minLength={6}
            />
          </div>

          {type === "register" && (
            <div>
              <Label htmlFor="userType" className="text-white">
                I am a:
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
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
