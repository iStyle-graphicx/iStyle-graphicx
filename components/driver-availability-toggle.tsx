"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Power, MapPin, Clock } from "lucide-react"

interface DriverAvailabilityToggleProps {
  driverId: string
  onStatusChange?: (isOnline: boolean) => void
}

export function DriverAvailabilityToggle({ driverId, onStatusChange }: DriverAvailabilityToggleProps) {
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchDriverStatus()
  }, [driverId])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isOnline && sessionStart) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStart.getTime()) / 1000)
        setSessionDuration(duration)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOnline, sessionStart])

  const fetchDriverStatus = async () => {
    try {
      const { data, error } = await supabase.from("drivers").select("is_online").eq("id", driverId).single()

      if (data) {
        setIsOnline(data.is_online)
        if (data.is_online) {
          setSessionStart(new Date())
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching driver status:", error)
    }
  }

  const toggleAvailability = async () => {
    setIsLoading(true)

    try {
      const newStatus = !isOnline

      // Update location if going online
      let locationUpdate = {}
      if (newStatus && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })

          locationUpdate = {
            current_lat: position.coords.latitude,
            current_lng: position.coords.longitude,
          }
        } catch (error) {
          console.error("[v0] Error getting location:", error)
          toast({
            title: "Location Error",
            description: "Could not get your location. Using default location.",
            variant: "destructive",
          })
        }
      }

      const { error } = await supabase
        .from("drivers")
        .update({
          is_online: newStatus,
          ...locationUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", driverId)

      if (error) throw error

      setIsOnline(newStatus)

      if (newStatus) {
        setSessionStart(new Date())
        setSessionDuration(0)
      } else {
        setSessionStart(null)
        setSessionDuration(0)
      }

      // Send notification
      await supabase.from("notifications").insert({
        user_id: driverId,
        title: newStatus ? "You're Online!" : "You're Offline",
        message: newStatus
          ? "You can now receive delivery requests from customers"
          : "You won't receive delivery requests until you go online again",
        type: "info",
        is_read: false,
      })

      toast({
        title: newStatus ? "You're now online" : "You're now offline",
        description: newStatus ? "You can now receive delivery requests" : "You won't receive delivery requests",
      })

      onStatusChange?.(newStatus)
    } catch (error: any) {
      console.error("[v0] Error toggling availability:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update availability status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <Power className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Driver Status</h3>
              <Badge className={`${isOnline ? "bg-green-500" : "bg-gray-500"} text-white mt-1`}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          <Button
            onClick={toggleAvailability}
            disabled={isLoading}
            className={`${
              isOnline ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            } text-white px-6`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isOnline ? (
              "Go Offline"
            ) : (
              "Go Online"
            )}
          </Button>
        </div>

        {isOnline && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Online for: {formatDuration(sessionDuration)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Location tracking active</span>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-xs">You are visible to customers and can receive delivery requests</p>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="pt-4 border-t border-white/10">
            <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
              <p className="text-gray-300 text-xs">Go online to start receiving delivery requests and earning money</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
