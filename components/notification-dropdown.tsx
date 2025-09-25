"use client"

import { useState } from "react"
import { Bell, Check, Trash2, AlertCircle, CheckCircle, Info, X, Clock, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "delivery_request":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "delivery_accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "delivery_completed":
        return <Truck className="w-4 h-4 text-purple-500" />
      case "payment_received":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <X className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "delivery_request":
        return "border-blue-500/50 bg-blue-500/5"
      case "delivery_accepted":
      case "delivery_completed":
      case "payment_received":
      case "success":
        return "border-green-500/50 bg-green-500/5"
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/5"
      case "error":
        return "border-red-500/50 bg-red-500/5"
      default:
        return "border-orange-500/50 bg-orange-500/5"
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-white hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-0">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 top-12 w-80 max-h-96 z-50 shadow-xl bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && <Badge className="bg-orange-500 text-white">{unreadCount} new</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No notifications yet</p>
                    <p className="text-gray-500 text-xs mt-1">New notifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-slate-700 transition-all hover:bg-slate-700/50 ${
                          !notification.is_read ? getNotificationColor(notification.type) : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-white text-sm leading-tight">{notification.title}</h4>
                                <p className="text-gray-300 text-xs mt-1 leading-relaxed">{notification.message}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {!notification.is_read && (
                                  <Button
                                    onClick={() => markAsRead(notification.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 p-1 h-6 w-6"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  onClick={() => deleteNotification(notification.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
