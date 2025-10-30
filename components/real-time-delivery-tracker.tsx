"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { realtimeTracking, type DeliveryStatusUpdate } from "@/lib/realtime-tracking"
import { Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react"

interface RealTimeDeliveryTrackerProps {
  deliveryId: string
  onStatusChange?: (status: string) => void
}

export function RealTimeDeliveryTracker({ deliveryId, onStatusChange }: RealTimeDeliveryTrackerProps) {
  const [status, setStatus] = useState<string>("pending")
  const [progress, setProgress] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Subscribe to real-time delivery updates
    realtimeTracking.subscribeToDelivery(deliveryId, (update: DeliveryStatusUpdate) => {
      setStatus(update.status)
      setLastUpdate(new Date(update.updated_at))
      onStatusChange?.(update.status)

      // Update progress based on status
      const progressMap: Record<string, number> = {
        pending: 0,
        accepted: 25,
        picked_up: 50,
        in_transit: 75,
        delivered: 100,
      }
      setProgress(progressMap[update.status] || 0)
    })

    return () => {
      realtimeTracking.unsubscribeFromDelivery(deliveryId)
    }
  }, [deliveryId, onStatusChange])

  const getStatusIcon = () => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "in_transit":
      case "picked_up":
        return <Truck className="w-5 h-5 text-orange-500" />
      case "accepted":
        return <Clock className="w-5 h-5 text-blue-500" />
      default:
        return <Package className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "in_transit":
      case "picked_up":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {getStatusIcon()}
          Delivery Progress
          <Badge className={`${getStatusColor()} ml-auto`}>
            <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></span>
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Status: {status.replace("_", " ").toUpperCase()}</span>
            <span className="text-gray-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 0 ? "bg-orange-500" : "bg-gray-700"}`}
            >
              <Package className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Order Placed</p>
              <p className="text-xs text-gray-400">Your delivery request has been received</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 25 ? "bg-orange-500" : "bg-gray-700"}`}
            >
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Driver Assigned</p>
              <p className="text-xs text-gray-400">A driver has accepted your delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 50 ? "bg-orange-500" : "bg-gray-700"}`}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Picked Up</p>
              <p className="text-xs text-gray-400">Driver has collected your items</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 75 ? "bg-orange-500" : "bg-gray-700"}`}
            >
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">In Transit</p>
              <p className="text-xs text-gray-400">On the way to destination</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 100 ? "bg-green-500" : "bg-gray-700"}`}
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Delivered</p>
              <p className="text-xs text-gray-400">Successfully delivered</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
