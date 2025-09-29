"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { OrderTracker } from "./order-tracker"
import { LiveMap } from "./live-map"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Search, Package, Truck, MapPin, Clock, CheckCircle, AlertCircle, Navigation, RefreshCw } from "lucide-react"

interface TrackingDashboardProps {
  user: any
}

interface ActiveOrder {
  id: string
  status: string
  pickup_address: string
  delivery_address: string
  item_description: string
  created_at: string
  driver?: {
    first_name: string
    last_name: string
    vehicle_type: string
    current_lat?: number
    current_lng?: number
  }
}

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  accepted: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle },
  in_transit: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Truck },
  delivered: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
}

export function TrackingDashboard({ user }: TrackingDashboardProps) {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchActiveOrders()

      // Set up real-time subscription for order updates
      const subscription = supabase
        .channel("active_orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "deliveries",
            filter: `customer_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("[v0] Order update received:", payload)
            fetchActiveOrders()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const fetchActiveOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          drivers(
            current_lat,
            current_lng,
            vehicle_type,
            profiles!inner(first_name, last_name)
          )
        `)
        .eq("customer_id", user.id)
        .in("status", ["pending", "accepted", "in_transit"])
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedOrders =
        data?.map((order) => ({
          ...order,
          driver: order.drivers
            ? {
                first_name: order.drivers.profiles.first_name,
                last_name: order.drivers.profiles.last_name,
                vehicle_type: order.drivers.vehicle_type,
                current_lat: order.drivers.current_lat,
                current_lng: order.drivers.current_lng,
              }
            : undefined,
        })) || []

      setActiveOrders(formattedOrders)
    } catch (error) {
      console.error("Error fetching active orders:", error)
      toast({
        title: "Error",
        description: "Failed to load active orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = activeOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    const Icon = config?.icon || Package
    return <Icon className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (selectedOrderId) {
    return (
      <div>
        <div className="px-4 pt-6 pb-4">
          <Button
            onClick={() => setSelectedOrderId(null)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <OrderTracker orderId={selectedOrderId} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded-lg"></div>
          <div className="h-48 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Tracking</h1>
          <p className="text-gray-400">{activeOrders.length} active deliveries</p>
        </div>
        <Button
          onClick={fetchActiveOrders}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white pl-10"
          placeholder="Search active orders..."
        />
      </div>

      {/* Active Orders */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <Navigation className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Deliveries</h3>
            <p className="text-gray-400">
              {searchTerm ? "No orders match your search" : "You don't have any active deliveries to track"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]

            return (
              <Card
                key={order.id}
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Package className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">#{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <Badge className={statusConfig?.color} variant="outline">
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status.replace("_", " ")}</span>
                    </Badge>
                  </div>

                  {/* Item */}
                  <div className="mb-3">
                    <p className="text-white font-medium truncate">{order.item_description}</p>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span className="text-gray-400">From:</span>
                      <span className="text-white truncate flex-1">{order.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span className="text-gray-400">To:</span>
                      <span className="text-white truncate flex-1">{order.delivery_address}</span>
                    </div>
                  </div>

                  {/* Driver Info */}
                  {order.driver && (
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Truck className="w-3 h-3 text-white" />
                        </div>
                        <div className="text-xs">
                          <p className="text-white">
                            {order.driver.first_name} {order.driver.last_name}
                          </p>
                          <p className="text-gray-400">{order.driver.vehicle_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs">Live</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Live Map for First Active Order */}
      {filteredOrders.length > 0 && <LiveMap orderId={filteredOrders[0].id} />}
    </div>
  )
}
