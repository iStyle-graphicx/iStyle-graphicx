"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { EnhancedDeliveryTracking } from "@/components/enhanced-delivery-tracking"
import { Package, MapPin, Search, Loader2 } from "lucide-react"

interface TrackSectionProps {
  user: any
}

interface Delivery {
  id: string
  tracking_code: string
  destination: string
  status: "pending" | "in_transit" | "delivered" | "cancelled"
  created_at: string
  pickup_address: string
  delivery_address: string
  driver_name?: string
  estimated_delivery?: string
}

export function TrackSection({ user }: TrackSectionProps) {
  const [trackingCode, setTrackingCode] = useState("")
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [trackedDelivery, setTrackedDelivery] = useState<Delivery | null>(null)
  const [showEnhancedTracking, setShowEnhancedTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchRecentDeliveries()
    } else {
      // Load sample data for non-authenticated users
      setRecentDeliveries([
        {
          id: "1",
          tracking_code: "VAN123456",
          destination: "123 Construction Site, Johannesburg",
          status: "in_transit",
          created_at: "2023-05-15",
          pickup_address: "Hardware Store, Pretoria",
          delivery_address: "123 Construction Site, Johannesburg",
          driver_name: "John Smith",
          estimated_delivery: "2023-05-15 16:30",
        },
        {
          id: "2",
          tracking_code: "VAN789012",
          destination: "456 Builder St, Pretoria",
          status: "delivered",
          created_at: "2023-05-10",
          pickup_address: "Cement Depot, Centurion",
          delivery_address: "456 Builder St, Pretoria",
          driver_name: "Sarah Johnson",
          estimated_delivery: "2023-05-10 14:00",
        },
        {
          id: "3",
          tracking_code: "VAN345678",
          destination: "789 Hardware Store, Cape Town",
          status: "pending",
          created_at: "2023-05-18",
          pickup_address: "Steel Supplier, Durban",
          delivery_address: "789 Hardware Store, Cape Town",
          estimated_delivery: "2023-05-19 10:00",
        },
      ])
    }
  }, [user])

  const fetchRecentDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      if (data) {
        setRecentDeliveries(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching deliveries:", error)
    }
  }

  const handleTrackDelivery = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Check in sample data first
    const sampleDelivery = recentDeliveries.find((d) => d.tracking_code.toLowerCase() === trackingCode.toLowerCase())

    if (sampleDelivery) {
      setTrackedDelivery(sampleDelivery)
      if (sampleDelivery.status === "in_transit" || sampleDelivery.status === "pending") {
        setShowEnhancedTracking(true)
      }
      toast({
        title: "Delivery Found",
        description: `Status: ${sampleDelivery.status.replace("_", " ").toUpperCase()}`,
      })
    } else {
      // Try database if user is authenticated
      if (user) {
        const { data, error } = await supabase
          .from("deliveries")
          .select("*")
          .eq("tracking_code", trackingCode.toUpperCase())
          .single()

        if (data) {
          setTrackedDelivery(data)
          if (data.status === "in_transit" || data.status === "pending") {
            setShowEnhancedTracking(true)
          }
          toast({
            title: "Delivery Found",
            description: `Status: ${data.status.replace("_", " ").toUpperCase()}`,
          })
        } else {
          toast({
            title: "Not Found",
            description: "No delivery found with this tracking code",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Not Found",
          description: "No delivery found with this tracking code",
          variant: "destructive",
        })
      }
    }

    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "in_transit":
        return "bg-orange-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered"
      case "in_transit":
        return "In Transit"
      case "pending":
        return "Pending"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  if (showEnhancedTracking && trackedDelivery) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Live Tracking</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEnhancedTracking(false)}
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            Back to List
          </Button>
        </div>
        <EnhancedDeliveryTracking deliveryId={trackedDelivery.id} />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold text-white">Track Delivery</h2>

      {/* Tracking Input */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-500" />
            Enter Tracking Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="e.g., VAN123456"
              className="bg-slate-700 border-slate-600 text-white flex-1"
              onKeyPress={(e) => e.key === "Enter" && handleTrackDelivery()}
            />
            <Button
              onClick={handleTrackDelivery}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tracking...
                </>
              ) : (
                "Track"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">Enter your tracking code to see real-time delivery updates</p>
        </CardContent>
      </Card>

      {/* Tracked Delivery Details */}
      {trackedDelivery && !showEnhancedTracking && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tracking Code:</span>
              <span className="font-semibold text-white">{trackedDelivery.tracking_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status:</span>
              <Badge className={`${getStatusColor(trackedDelivery.status)} text-white`}>
                {getStatusText(trackedDelivery.status)}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">From:</p>
                  <p className="text-white">{trackedDelivery.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">To:</p>
                  <p className="text-white">{trackedDelivery.delivery_address}</p>
                </div>
              </div>
            </div>
            {trackedDelivery.driver_name && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Driver:</span>
                <span className="text-white">{trackedDelivery.driver_name}</span>
              </div>
            )}
            {trackedDelivery.estimated_delivery && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Est. Delivery:</span>
                <span className="text-white">{new Date(trackedDelivery.estimated_delivery).toLocaleString()}</span>
              </div>
            )}
            {(trackedDelivery.status === "in_transit" || trackedDelivery.status === "pending") && (
              <Button
                onClick={() => setShowEnhancedTracking(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                View Live Tracking
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Deliveries */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentDeliveries.length > 0 ? (
            recentDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => {
                  setTrackedDelivery(delivery)
                  if (delivery.status === "in_transit" || delivery.status === "pending") {
                    setShowEnhancedTracking(true)
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{delivery.tracking_code}</h4>
                    <p className="text-sm text-gray-400">To: {delivery.destination}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(delivery.status)} text-white text-xs`}>
                      {getStatusText(delivery.status)}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">{delivery.created_at}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No recent deliveries found</p>
              <p className="text-sm text-gray-500 mt-1">Your delivery history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
