"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  Star,
  Package,
  History,
  Settings,
  Shield,
  MapPin,
} from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { ProfileVerificationStatus } from "@/components/profile-verification-status"
import { DriverProfileForm } from "@/components/driver-profile-form"

interface ProfileSectionProps {
  user: any
  onLogout: () => void
  onRefreshProfile?: () => void
  onNavigateToSection?: (section: string) => void
}

export function ProfileSection({ user, onLogout, onRefreshProfile, onNavigateToSection }: ProfileSectionProps) {
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryStats, setDeliveryStats] = useState({ total: 0, pending: 0, completed: 0, rating: 0 })
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [driverData, setDriverData] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchDeliveryStats()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user?.id) return

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) {
      setProfile(data)
      if (data.user_type === "driver") {
        const { data: driverInfo } = await supabase.from("drivers").select("*").eq("id", user.id).single()
        setDriverData(driverInfo)
      }
    } else if (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchDeliveryStats = async () => {
    if (!user?.id) return

    const { data: deliveries } = await supabase
      .from("deliveries")
      .select("status, customer_rating")
      .eq(profile?.user_type === "driver" ? "driver_id" : "customer_id", user.id)

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

      const ratingsData = deliveries.filter((d) => d.customer_rating)
      if (ratingsData.length > 0) {
        const avgRating = ratingsData.reduce((sum, r) => sum + r.customer_rating, 0) / ratingsData.length
        stats.rating = Math.round(avgRating * 10) / 10
      }

      setDeliveryStats(stats)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to update your profile",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      setIsEditing(false)

      if (onRefreshProfile) {
        onRefreshProfile()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    fetchProfile()
  }

  const handleAvatarUpdate = async (url: string) => {
    setProfile({ ...profile, avatar_url: url })

    if (user?.id) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id)

      if (onRefreshProfile) {
        onRefreshProfile()
      }
    }
  }

  const handleDriverProfileComplete = () => {
    setShowDriverForm(false)
    fetchProfile()
    toast({
      title: "Profile Submitted",
      description: "Your driver profile has been submitted for verification",
    })
  }

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-16">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2 text-white">My Profile</h2>
            <p className="text-gray-300 mb-6">Please log in to view and manage your profile.</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Login / Register</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profile?.user_type === "driver" && showDriverForm) {
    return (
      <div className="px-4 pt-6 pb-16">
        <DriverProfileForm
          userId={user.id}
          onComplete={handleDriverProfileComplete}
          onCancel={() => setShowDriverForm(false)}
        />
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

      {profile && (
        <ProfileCompletionBanner
          user={user}
          profile={profile}
          onEditProfile={() => setIsEditing(true)}
          onAddPayment={() => {}}
        />
      )}

      {profile?.user_type === "driver" &&
        (!driverData || !driverData.verification_status || driverData.verification_status === "pending") && (
          <Card className="bg-orange-500/10 backdrop-blur-md border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Complete Your Driver Profile</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    To start accepting deliveries, you need to complete your driver profile and submit required
                    documents for verification.
                  </p>
                  <Button
                    onClick={() => setShowDriverForm(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Complete Driver Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <ProfileAvatarUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url}
              onAvatarUpdate={handleAvatarUpdate}
              size="lg"
              editable={true}
            />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName" className="text-white text-xs mb-1">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profile?.first_name || ""}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder="First Name"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white text-xs mb-1">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profile?.last_name || ""}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder="Last Name"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white text-xs mb-1">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={profile?.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-white text-xl">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
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

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span>User ID:</span>
            </div>
            <span className="font-medium text-white text-sm">{user.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-4 h-4" />
              <span>Account Type:</span>
            </div>
            <span className="font-medium text-white capitalize">{profile?.user_type || "Customer"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4" />
              <span>Email:</span>
            </div>
            <span className="font-medium text-white text-sm">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-400">
              <Phone className="w-4 h-4" />
              <span>Phone:</span>
            </div>
            <span className="font-medium text-white">{profile?.phone || "Not set"}</span>
          </div>
          <div className="flex justify-between items-center py-2">
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

      {profile && <ProfileVerificationStatus userId={user.id} userType={profile.user_type || "customer"} />}

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

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile?.user_type === "driver" && (
            <Button
              onClick={() => setShowDriverForm(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Update Driver Profile & Documents
            </Button>
          )}
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Edit Profile Details
          </Button>
          <Button
            onClick={() => {
              if (onNavigateToSection) {
                onNavigateToSection("deliveryHistorySection")
              } else {
                toast({
                  title: "Navigation",
                  description: "Opening delivery history...",
                })
              }
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" />
            View Delivery History
          </Button>
          <Button
            onClick={() => {
              if (onNavigateToSection) {
                onNavigateToSection("deliveryAreasSection")
              } else {
                toast({
                  title: "Navigation",
                  description: "Opening delivery areas...",
                })
              }
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            View Delivery Areas
          </Button>
          <Button
            onClick={() => {
              if (onNavigateToSection) {
                onNavigateToSection("settingsSection")
              } else {
                toast({
                  title: "Navigation",
                  description: "Opening settings...",
                })
              }
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
          >
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
