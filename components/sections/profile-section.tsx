"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { User, Edit, Save, X, Phone, Mail, Calendar, Star, Package, History, Settings } from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { ProfileVerificationStatus } from "@/components/profile-verification-status"

interface ProfileSectionProps {
  user: any
  onLogout: () => void
}

export function ProfileSection({ user, onLogout }: ProfileSectionProps) {
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryStats, setDeliveryStats] = useState({ total: 0, pending: 0, completed: 0, rating: 0 })
  const [showAddPayment, setShowAddPayment] = useState(false)
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
      setDeliveryStats({ total: 0, pending: 0, completed: 0, rating: 0 })
    }
  }, [user])

  const fetchProfile = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) {
      setProfile(data)
    }
  }

  const fetchDeliveryStats = async () => {
    // Fetch delivery statistics
    const { data: deliveries, error: deliveryError } = await supabase
      .from("deliveries")
      .select("status")
      .eq(user.user_type === "driver" ? "driver_id" : "customer_id", user.id)

    if (deliveries) {
      const stats = deliveries.reduce(
        (acc, delivery) => {
          acc.total++
          if (delivery.status === "pending" || delivery.status === "accepted" || delivery.status === "picked_up") {
            acc.pending++
          } else if (delivery.status === "completed") {
            acc.completed++
          }
          return acc
        },
        { total: 0, pending: 0, completed: 0, rating: 0 },
      )

      // Fetch average rating
      const { data: ratings } = await supabase
        .from("ratings")
        .select("rating")
        .eq(user.user_type === "driver" ? "driver_id" : "customer_id", user.id)

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        stats.rating = Math.round(avgRating * 10) / 10
      }

      setDeliveryStats(stats)
    }
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

  const handleAvatarUpdate = (url: string) => {
    setProfile({ ...profile, avatar_url: url })
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

      {/* Profile Completion Banner */}
      {user && (
        <ProfileCompletionBanner
          user={user}
          profile={profile}
          onEditProfile={() => setIsEditing(true)}
          onAddPayment={() => setShowAddPayment(true)}
        />
      )}

      {/* Profile Header */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <ProfileAvatarUpload
              userId={user?.id || "demo"}
              currentAvatarUrl={profile?.avatar_url}
              onAvatarUpdate={handleAvatarUpdate}
              size="lg"
              editable={isEditing && !!user}
            />
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
                  {deliveryStats.rating > 0 && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{deliveryStats.rating} rating</span>
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

      {/* Verification Status */}
      {user && <ProfileVerificationStatus userId={user.id} userType={profile?.user_type || "customer"} />}

      {/* Delivery Statistics */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            {profile?.user_type === "driver" ? "Driver Statistics" : "Delivery Statistics"}
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
              <div className="text-xs text-gray-400">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{deliveryStats.completed}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
          {deliveryStats.rating > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <div className="text-2xl font-bold text-yellow-500">{deliveryStats.rating}</div>
              <div className="text-xs text-gray-400">Average Rating</div>
            </div>
          )}
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
            <Settings className="w-4 h-4" />
            Account Settings
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
