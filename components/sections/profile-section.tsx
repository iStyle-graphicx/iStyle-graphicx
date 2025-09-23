"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { User, Camera, Edit, Save, X, Phone, Mail, Calendar, Star, Package, History } from "lucide-react"

interface ProfileSectionProps {
  user: any
  onLogout: () => void
}

export function ProfileSection({ user, onLogout }: ProfileSectionProps) {
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [deliveryStats, setDeliveryStats] = useState({ total: 0, pending: 0, completed: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchDeliveryStats()
    } else {
      // Set sample data for non-authenticated users
      setProfile({
        first_name: "John",
        last_name: "Doe",
        phone: "+27 82 123 4567",
        user_type: "customer",
        created_at: "2023-01-15",
      })
      setDeliveryStats({ total: 0, pending: 0, completed: 0 })
    }
  }, [user])

  const fetchProfile = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) {
      setProfile(data)
      setAvatarUrl(data.avatar_url)
    }
  }

  const fetchDeliveryStats = async () => {
    const { data, error } = await supabase.from("deliveries").select("status").eq("customer_id", user.id)

    if (data) {
      const stats = data.reduce(
        (acc, delivery) => {
          acc.total++
          if (delivery.status === "pending" || delivery.status === "in_transit") {
            acc.pending++
          } else if (delivery.status === "delivered") {
            acc.completed++
          }
          return acc
        },
        { total: 0, pending: 0, completed: 0 },
      )

      setDeliveryStats(stats)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    // Create a file URL for preview
    const fileUrl = URL.createObjectURL(file)
    setAvatarUrl(fileUrl)

    // In a real app, you would upload to Supabase Storage
    // For now, we'll just update the profile with a placeholder
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile photo",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        })
      }
    }

    setIsLoading(false)
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setIsEditing(false)
      }
    } else {
      // For non-authenticated users, just show success
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      setIsEditing(false)
    }

    setIsLoading(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (user) {
      fetchProfile() // Reset to original data
    }
  }

  if (!user && !profile) {
    return (
      <div className="px-4 pt-6 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-white">My Profile</h2>
        <p className="text-gray-300">Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        {isEditing ? (
          <Button
            onClick={handleCancelEdit}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={profile?.first_name || ""}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="First Name"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Input
                      value={profile?.last_name || ""}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      placeholder="Last Name"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Input
                    value={profile?.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-white text-xl">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email || "user@example.com"}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span>User ID:</span>
            </div>
            <span className="font-medium text-white text-sm">{user?.id?.slice(0, 8) || "ec015b97"}...</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-4 h-4" />
              <span>Account Type:</span>
            </div>
            <span className="font-medium text-white capitalize">{profile?.user_type || "Customer"}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Member Since:</span>
            </div>
            <span className="font-medium text-white">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Statistics */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Delivery Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-500">{deliveryStats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{deliveryStats.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{deliveryStats.completed}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Edit Profile Details
          </Button>
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            View Delivery History
          </Button>
          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-semibold flex items-center gap-2">
            <Star className="w-4 h-4" />
            Rate & Review
          </Button>
          <Button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-semibold"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
