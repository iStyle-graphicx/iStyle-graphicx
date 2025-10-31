"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  User,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  Camera,
  Settings,
  History,
  CreditCard,
  Bell,
  Shield,
  LogOut,
} from "lucide-react"

interface ProfileSectionProps {
  onNavigate: (section: string) => void
}

interface ProfileData {
  id: string
  first_name: string
  last_name: string
  phone: string
  phone_number: string
  user_type: string
  avatar_url: string | null
  created_at: string
}

interface DeliveryStats {
  total: number
  completed: number
  pending: number
  cancelled: number
}

interface DriverStats {
  total_deliveries: number
  total_earnings: number
  rating: number
  is_online: boolean
}

export function ProfileSection({ onNavigate }: ProfileSectionProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  })
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null)

  const [editedData, setEditedData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/profile/update")

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()

      setProfileData(data.profile)
      setDeliveryStats(data.stats)
      setDriverStats(data.driverStats)

      setEditedData({
        first_name: data.profile.first_name || "",
        last_name: data.profile.last_name || "",
        phone: data.profile.phone || data.profile.phone_number || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      // Update local state
      if (profileData) {
        setProfileData({
          ...profileData,
          avatar_url: data.url,
        })
      }

      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      })
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to update profile photo",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      })

      if (!response.ok) {
        throw new Error("Update failed")
      }

      const data = await response.json()
      setProfileData(data.profile)
      setIsEditing(false)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profileData) {
      setEditedData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || profileData.phone_number || "",
      })
    }
    setIsEditing(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white/20">
              {profileData?.avatar_url ? (
                <img
                  src={profileData.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white"
            >
              {isUploadingAvatar ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">
              {profileData?.first_name} {profileData?.last_name}
            </h3>
            <p className="text-sm text-white/60 capitalize">{profileData?.user_type || "Customer"}</p>
            <p className="text-xs text-white/40 mt-1">
              Member since {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-white/60 text-sm">First Name</Label>
            {isEditing ? (
              <Input
                value={editedData.first_name}
                onChange={(e) => setEditedData({ ...editedData, first_name: e.target.value })}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            ) : (
              <p className="text-white mt-1">{profileData?.first_name || "Not set"}</p>
            )}
          </div>
          <div>
            <Label className="text-white/60 text-sm">Last Name</Label>
            {isEditing ? (
              <Input
                value={editedData.last_name}
                onChange={(e) => setEditedData({ ...editedData, last_name: e.target.value })}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            ) : (
              <p className="text-white mt-1">{profileData?.last_name || "Not set"}</p>
            )}
          </div>
          <div>
            <Label className="text-white/60 text-sm">Phone Number</Label>
            {isEditing ? (
              <Input
                value={editedData.phone}
                onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            ) : (
              <p className="text-white mt-1">{profileData?.phone || profileData?.phone_number || "Not set"}</p>
            )}
          </div>
          <div>
            <Label className="text-white/60 text-sm">Email</Label>
            <p className="text-white mt-1">{user?.email || "Not set"}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {profileData?.user_type === "driver" ? "Driver Statistics" : "Delivery Statistics"}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-orange-500" />
              <span className="text-white/60 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {profileData?.user_type === "driver" ? driverStats?.total_deliveries || 0 : deliveryStats.total}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white/60 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{deliveryStats.completed}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-white/60 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">{deliveryStats.pending}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-white/60 text-sm">Cancelled</span>
            </div>
            <p className="text-2xl font-bold text-white">{deliveryStats.cancelled}</p>
          </div>
        </div>

        {profileData?.user_type === "driver" && driverStats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                <span className="text-white/60 text-sm">Total Earnings</span>
              </div>
              <p className="text-2xl font-bold text-white">R{driverStats.total_earnings.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-yellow-500" />
                <span className="text-white/60 text-sm">Rating</span>
              </div>
              <p className="text-2xl font-bold text-white">{driverStats.rating.toFixed(1)} ⭐</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <Edit2 className="w-5 h-5 mr-3 text-orange-500" />
            Edit Profile Details
          </Button>
          <Button
            onClick={() => onNavigate("deliveryHistorySection")}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <History className="w-5 h-5 mr-3 text-blue-500" />
            View Delivery History
          </Button>
          <Button
            onClick={() => onNavigate("settingsSection")}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <Settings className="w-5 h-5 mr-3 text-purple-500" />
            Account Settings
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Delivery areas feature will be available soon",
              })
            }}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <MapPin className="w-5 h-5 mr-3 text-green-500" />
            View Delivery Areas
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Payment methods feature will be available soon",
              })
            }}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <CreditCard className="w-5 h-5 mr-3 text-yellow-500" />
            Payment Methods
          </Button>
          <Button
            onClick={() => onNavigate("settingsSection")}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <Bell className="w-5 h-5 mr-3 text-pink-500" />
            Notification Settings
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Privacy & security settings will be available soon",
              })
            }}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <Shield className="w-5 h-5 mr-3 text-cyan-500" />
            Privacy & Security
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  )
}
