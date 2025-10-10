"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { NotificationsCenter } from "./notifications-center"

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (userId) {
      fetchUnreadCount()
      setupRealtimeSubscription()
    }
  }, [userId])

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (!error && count !== null) {
        setUnreadCount(count)
      }
    } catch (error) {
      console.error("[v0] Error fetching unread count:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("notification_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowNotifications(!showNotifications)}
        variant="ghost"
        size="sm"
        className="relative text-white hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 z-50 shadow-xl">
          <NotificationsCenter userId={userId} onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </div>
  )
}
