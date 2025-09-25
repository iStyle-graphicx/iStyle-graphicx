"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type:
    | "delivery_request"
    | "delivery_accepted"
    | "delivery_completed"
    | "payment_received"
    | "system"
    | "success"
    | "warning"
    | "error"
    | "info"
  is_read: boolean
  created_at: string
  user_id: string
  metadata?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  createNotification: (notification: Omit<Notification, "id" | "created_at" | "is_read">) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchNotifications()
    setupRealtimeSubscription()

    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [userId])

  const fetchNotifications = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (data && !error) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[v0] Real-time notification update:", payload)

          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as Notification
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Show browser notification
            showBrowserNotification(newNotification)

            // Play notification sound
            playNotificationSound(newNotification.type)

            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedNotification = payload.new as Notification
            setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showBrowserNotification = (notification: Notification) => {
    if (typeof window === "undefined" || !("Notification" in window)) return

    if (Notification.permission === "granted") {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/images/vango-logo.png",
        badge: "/images/vango-logo.png",
        tag: notification.id,
        requireInteraction: notification.type === "delivery_request",
      })

      browserNotification.onclick = () => {
        window.focus()
        markAsRead(notification.id)
        browserNotification.close()
      }

      // Auto close after 5 seconds for non-critical notifications
      if (notification.type !== "delivery_request") {
        setTimeout(() => browserNotification.close(), 5000)
      }
    }
  }

  const playNotificationSound = (type: string) => {
    if (typeof window === "undefined") return

    try {
      const audio = new Audio()

      switch (type) {
        case "delivery_request":
        case "delivery_accepted":
          audio.src = "/sounds/notification-important.mp3"
          break
        case "delivery_completed":
        case "payment_received":
          audio.src = "/sounds/notification-success.mp3"
          break
        case "error":
        case "warning":
          audio.src = "/sounds/notification-error.mp3"
          break
        default:
          audio.src = "/sounds/notification-default.mp3"
          break
      }

      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      })
    } catch (error) {
      // Ignore audio errors
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (!error) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast({
          title: "All notifications marked as read",
          description: "All notifications have been marked as read",
        })
      }
    } catch (error) {
      console.error("[v0] Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        toast({
          title: "Notification deleted",
          description: "Notification has been deleted",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
    }
  }

  const clearAllNotifications = async () => {
    if (!userId) return

    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

      if (!error) {
        setNotifications([])
        setUnreadCount(0)
        toast({
          title: "All notifications cleared",
          description: "All notifications have been cleared",
        })
      }
    } catch (error) {
      console.error("[v0] Error clearing all notifications:", error)
    }
  }

  const createNotification = async (notification: Omit<Notification, "id" | "created_at" | "is_read">) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        ...notification,
        is_read: false,
      })

      if (error) {
        console.error("[v0] Error creating notification:", error)
      }
    } catch (error) {
      console.error("[v0] Error creating notification:", error)
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
