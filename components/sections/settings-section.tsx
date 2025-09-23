"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { User, CreditCard, Bell, Globe, Palette, Trash2, Info } from "lucide-react"

interface SettingsSectionProps {
  user: any
}

export function SettingsSection({ user }: SettingsSectionProps) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchPaymentMethods()
    }
  }, [user])

  const fetchProfile = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) setProfile(data)
  }

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase.from("payment_methods").select("*").eq("user_id", user.id)

    if (data) setPaymentMethods(data)
  }

  const updateProfile = async (field: string, value: string) => {
    setIsLoading(true)
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value, updated_at: new Date().toISOString() })
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
      fetchProfile()
    }
    setIsLoading(false)
  }

  const clearCache = () => {
    localStorage.removeItem("vangoDeliveries")
    localStorage.removeItem("vangoNotifications")
    localStorage.removeItem("vangoUser")
    toast({
      title: "Cache cleared",
      description: "App cache cleared successfully",
    })
  }

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>
        <p className="text-gray-300">Please log in to access settings.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>

      {/* Account Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-white">
                First Name
              </Label>
              <Input
                id="firstName"
                className="bg-slate-700 border-slate-600 text-white"
                value={profile?.first_name || ""}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                onBlur={(e) => updateProfile("first_name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-white">
                Last Name
              </Label>
              <Input
                id="lastName"
                className="bg-slate-700 border-slate-600 text-white"
                value={profile?.last_name || ""}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                onBlur={(e) => updateProfile("last_name", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">
              Phone Number
            </Label>
            <Input
              id="phone"
              className="bg-slate-700 border-slate-600 text-white"
              value={profile?.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              onBlur={(e) => updateProfile("phone", e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center py-3 border-t border-white/10">
            <div>
              <h4 className="font-semibold text-white">Change Password</h4>
              <p className="text-sm text-gray-400">Update your account password</p>
            </div>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 text-sm">Change</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-white font-medium">{method.type.toUpperCase()}</p>
                    <p className="text-sm text-gray-400">
                      {method.type === "mastercard"
                        ? `****${method.details.last4}`
                        : method.details.email || method.details.account}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Add Payment Method</Button>

          <div className="flex justify-between items-center py-3 border-t border-white/10">
            <div>
              <h4 className="font-semibold text-white">Billing History</h4>
              <p className="text-sm text-gray-400">View your payment history and receipts</p>
            </div>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 text-sm">View History</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">Email Notifications</h4>
                <p className="text-sm text-gray-400">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">Push Notifications</h4>
                <p className="text-sm text-gray-400">Receive push notifications on your device</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">SMS Notifications</h4>
                <p className="text-sm text-gray-400">Receive text messages for important updates</p>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">Marketing Communications</h4>
                <p className="text-sm text-gray-400">Receive promotional offers and updates</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-orange-500" />
              <div>
                <h4 className="font-semibold text-white">Language</h4>
                <p className="text-sm text-gray-400">Change app language</p>
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="English" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="af">Afrikaans</SelectItem>
                <SelectItem value="zu">Zulu</SelectItem>
                <SelectItem value="st">Sotho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-orange-500" />
              <div>
                <h4 className="font-semibold text-white">Theme</h4>
                <p className="text-sm text-gray-400">Change app appearance</p>
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Dark" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-500" />
              <div>
                <h4 className="font-semibold text-white">Clear Cache</h4>
                <p className="text-sm text-gray-400">Free up storage space</p>
              </div>
            </div>
            <Button onClick={clearCache} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm">
              Clear
            </Button>
          </div>

          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-blue-500" />
              <div>
                <h4 className="font-semibold text-white">App Version</h4>
                <p className="text-sm text-gray-400">Current version information</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">v2.1.0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
