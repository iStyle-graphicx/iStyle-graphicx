"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react"

interface DashboardOverviewProps {
  user: any
  onRequestDelivery: () => void
}

interface DashboardStats {
  totalDeliveries: number
  activeDeliveries: number
  completedDeliveries: number
  totalSpent: number
  averageRating: number
  onTimeRate: number
}

interface ActiveDelivery {
  id: string
  pickup_address: string
  delivery_address: string
  status: string
  created_at: string
  delivery_fee: number
  item_description: string
  driver?: {
    first_name: string
    last_name: string
    rating: number
    vehicle_type: string
  }
}

export function DashboardOverview({ user, onRequestDelivery }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalSpent: 0,
    averageRating: 0,
    onTimeRate: 0,
  })
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch user deliveries with driver information
      const { data: deliveries, error: deliveriesError } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          drivers!deliveries_driver_id_fkey(
            id,
            rating,
            vehicle_type
          )
        `,
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (deliveriesError) {
        console.error("[v0] Error fetching deliveries:", deliveriesError)
        throw deliveriesError
      }

      // Fetch driver profiles separately for deliveries that have drivers
      const driverIds = deliveries?.filter((d) => d.driver_id).map((d) => d.driver_id) || []
      let driverProfiles: Record<string, any> = {}

      if (driverIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", driverIds)

        if (!profilesError && profiles) {
          driverProfiles = profiles.reduce(
            (acc, profile) => {
              acc[profile.id] = profile
              return acc
            },
            {} as Record<string, any>,
          )
        }
      }

      // Merge driver profile data with delivery data
      const enrichedDeliveries = deliveries?.map((delivery) => ({
        ...delivery,
        driver: delivery.drivers
          ? {
              ...delivery.drivers,
              first_name: driverProfiles[delivery.driver_id]?.first_name || "Unknown",
              last_name: driverProfiles[delivery.driver_id]?.last_name || "Driver",
            }
          : undefined,
      }))

      // Calculate stats
      const total = deliveries?.length || 0
      const active = deliveries?.filter((d) => ["pending", "accepted", "in_transit"].includes(d.status)).length || 0
      const completed = deliveries?.filter((d) => d.status === "delivered").length || 0
      const totalSpent = deliveries?.reduce((sum, d) => sum + (d.delivery_fee || 0), 0) || 0

      const deliveriesWithRatings = deliveries?.filter((d) => d.customer_rating && d.status === "delivered") || []
      const avgRating =
        deliveriesWithRatings.length > 0
          ? deliveriesWithRatings.reduce((sum, d) => sum + d.customer_rating, 0) / deliveriesWithRatings.length
          : 0

      const completedWithTiming = deliveries?.filter((d) => d.status === "delivered" && d.delivered_at) || []
      const onTimeDeliveries =
        completedWithTiming.filter((d) => {
          const estimatedTime = new Date(d.estimated_delivery).getTime()
          const actualTime = new Date(d.delivered_at).getTime()
          return actualTime <= estimatedTime
        }).length || 0
      const onTimeRate = completedWithTiming.length > 0 ? (onTimeDeliveries / completedWithTiming.length) * 100 : 0

      setStats({
        totalDeliveries: total,
        activeDeliveries: active,
        completedDeliveries: completed,
        totalSpent,
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        onTimeRate: Math.round(onTimeRate),
      })

      // Set active deliveries
      const activeDeliveriesData = enrichedDeliveries
        ?.filter((d) => ["pending", "accepted", "in_transit"].includes(d.status))
        .slice(0, 3)
        .map((delivery) => ({
          ...delivery,
          driver: delivery.driver
            ? {
                first_name: delivery.driver.first_name,
                last_name: delivery.driver.last_name,
                rating: delivery.driver.rating,
                vehicle_type: delivery.driver.vehicle_type,
              }
            : undefined,
        }))

      setActiveDeliveries(activeDeliveriesData || [])

      // Set recent activity (last 5 deliveries)
      setRecentActivity(enrichedDeliveries?.slice(0, 5) || [])
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "in_transit":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "accepted":
        return <CheckCircle className="w-4 h-4" />
      case "in_transit":
        return <Truck className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6" data-tour="dashboard-overview">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.first_name || "User"}!</h1>
            <p className="text-gray-400 text-sm">Here's what's happening with your deliveries</p>
          </div>
          <Button
            onClick={onRequestDelivery}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg"
            data-tour="request-delivery"
          >
            <Package className="w-4 h-4 mr-2" />
            New Delivery
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalDeliveries}</p>
                <p className="text-xs text-gray-400">Total Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.activeDeliveries}</p>
                <p className="text-xs text-gray-400">Active Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{stats.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.averageRating}</p>
                <p className="text-xs text-gray-400">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      {stats.completedDeliveries > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.onTimeRate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">On-Time Delivery Rate</span>
                  <span className="text-sm font-semibold text-white">{stats.onTimeRate}%</span>
                </div>
                <Progress value={stats.onTimeRate} className="h-2" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Completion Rate</span>
                <span className="text-sm font-semibold text-white">
                  {stats.totalDeliveries > 0
                    ? Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={stats.totalDeliveries > 0 ? (stats.completedDeliveries / stats.totalDeliveries) * 100 : 0}
                className="h-2"
              />
            </div>

            {stats.averageRating > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm text-gray-300">Your Average Rating</span>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold text-white">{stats.averageRating}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Active Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(delivery.status)}>
                        {getStatusIcon(delivery.status)}
                        <span className="ml-1 capitalize">{delivery.status.replace("_", " ")}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-white font-medium truncate">{delivery.item_description}</p>
                  </div>
                  <p className="text-sm font-semibold text-orange-400">R{delivery.delivery_fee}</p>
                </div>

                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">From: {delivery.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">To: {delivery.delivery_address}</span>
                  </div>
                </div>

                {delivery.driver && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <Truck className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-white">
                        {delivery.driver.first_name} {delivery.driver.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-white">{delivery.driver.rating}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onRequestDelivery}
              className="bg-orange-500 hover:bg-orange-600 text-white p-4 h-auto flex flex-col items-center gap-2"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">Request Delivery</span>
            </Button>

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2 bg-transparent"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-sm">Track Orders</span>
            </Button>

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2 bg-transparent"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Schedule Delivery</span>
            </Button>

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2 bg-transparent"
            >
              <Star className="w-6 h-6" />
              <span className="text-sm">Rate Drivers</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                <div className="p-1.5 bg-orange-500/20 rounded-full">{getStatusIcon(activity.status)}</div>
                <div className="flex-1">
                  <p className="text-sm text-white truncate">{activity.item_description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.created_at).toLocaleDateString()} • R{activity.delivery_fee}
                  </p>
                </div>
                <Badge className={getStatusColor(activity.status)} variant="outline">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalDeliveries === 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Ready for your first delivery?</h3>
            <p className="text-gray-300 mb-6">
              Get started by requesting your first delivery. We'll connect you with a reliable driver in minutes.
            </p>
            <Button
              onClick={onRequestDelivery}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3"
            >
              Request Your First Delivery
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
