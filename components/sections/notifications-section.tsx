"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Bell, Check, Trash2, AlertCircle, CheckCircle, Info, X } from "lucide-react"

interface NotificationsSectionProps {
  user: any
}

export function NotificationsSection({ user }: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Set up real-time subscription
      const subscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log("[v0] Real-time notification update:", payload)
            fetchNotifications()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setNotifications(data)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (!error) {
      fetchNotifications()
      toast({
        title: "Marked as read",
        description: "Notification marked as read",
      })
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (!error) {
      fetchNotifications()
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read",
      })
    }
    setIsLoading(false)
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (!error) {
      fetchNotifications()
      toast({
        title: "Notification deleted",
        description: "Notification has been deleted",
      })
    }
  }

  const clearAllNotifications = async () => {
    setIsLoading(true)
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)

    if (!error) {
      setNotifications([])
      toast({
        title: "All notifications cleared",
        description: "All notifications have been cleared",
      })
    }
    setIsLoading(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-white">Notifications</h2>
        <p className="text-gray-300">Please log in to view notifications.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && <Badge className="bg-orange-500 text-white">{unreadCount} new</Badge>}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={isLoading}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              onClick={clearAllNotifications}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
            <p className="text-gray-400">You're all caught up! New notifications will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-white/10 backdrop-blur-md border-white/20 transition-all ${
                !notification.is_read ? "border-orange-500/50 bg-orange-500/5" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
                        <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            size="sm"
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 p-1"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notification Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm mb-4">
            Manage your notification preferences in Settings to control what notifications you receive.
          </p>
          <Button className="bg-slate-700 hover:bg-slate-600 text-white">Go to Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
