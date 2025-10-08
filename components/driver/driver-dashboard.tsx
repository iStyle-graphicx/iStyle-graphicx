"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, Star, TrendingUp, Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DriverDashboardProps {
  user: any
  profile: any
  driver: any
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function DriverDashboard({ user, profile, driver }: DriverDashboardProps) {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(driver?.is_online || false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    subscribeToNotifications()

    // Update driver location periodically if online
    if (isOnline) {
      updateDriverLocation()
      const locationInterval = setInterval(updateDriverLocation, 30000) // Every 30 seconds
      return () => clearInterval(locationInterval)
    }
  }, [isOnline])

  const loadNotifications = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  const subscribeToNotifications = () => {
    const supabase = createClient()

    const channel = supabase
      .channel("driver-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[v0] New notification received:", payload)
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)

          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/favicon.ico",
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const updateDriverLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const supabase = createClient()
          await supabase
            .from("drivers")
            .update({
              current_lat: position.coords.latitude,
              current_lng: position.coords.longitude,
            })
            .eq("id", user.id)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
        },
      )
    }
  }

  const toggleOnlineStatus = async () => {
    const supabase = createClient()
    const newStatus = !isOnline

    // Request notification permission when going online
    if (newStatus && Notification.permission === "default") {
      await Notification.requestPermission()
    }

    const { error } = await supabase.from("drivers").update({ is_online: newStatus }).eq("id", user.id)

    if (!error) {
      setIsOnline(newStatus)
      if (newStatus) {
        updateDriverLocation()
      }
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const getStatusBadge = () => {
    switch (driver?.status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>
      case "pending_verification":
        return <Badge variant="secondary">Pending Verification</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">VANGO Driver</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button variant="outline" size="icon" onClick={() => router.push("/driver/notifications")}>
                <Bell className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {getStatusBadge()}
            <span className="text-sm text-muted-foreground">
              {profile?.first_name} {profile?.last_name}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.first_name}!</h2>
            <p className="text-muted-foreground">
              {driver?.status === "verified"
                ? "You're ready to accept deliveries"
                : "Complete your verification to start earning"}
            </p>
          </div>
          {driver?.status === "verified" && (
            <Button size="lg" variant={isOnline ? "destructive" : "default"} onClick={toggleOnlineStatus}>
              {isOnline ? "Go Offline" : "Go Online"}
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${driver?.total_earnings || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driver?.total_deliveries || 0}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driver?.rating || 0}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isOnline ? "Online" : "Offline"}</div>
              <p className="text-xs text-muted-foreground">Current status</p>
            </CardContent>
          </Card>
        </div>

        {driver?.status !== "verified" && (
          <Card className="border-yellow-500 mb-8">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                You need to complete verification before you can start accepting deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/driver/profile-setup">Complete Profile Setup</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {driver?.status === "verified" && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  {isOnline
                    ? "You'll receive notifications for new delivery requests"
                    : "Go online to receive delivery requests"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${notification.is_read ? "bg-background" : "bg-muted/50"}`}
                        onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Deliveries</CardTitle>
                <CardDescription>
                  {isOnline ? "Waiting for delivery requests..." : "Go online to see available deliveries"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No deliveries available at the moment</p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
