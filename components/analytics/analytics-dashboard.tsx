"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { EarningsChart } from "./earnings-chart"
import { DeliveryStatsChart } from "./delivery-stats-chart"
import { PerformanceMetrics } from "./performance-metrics"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsDashboardProps {
  userId: string
  userType: "customer" | "driver"
}

export function AnalyticsDashboard({ userId, userType }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week")
  const [earningsData, setEarningsData] = useState<Array<{ date: string; earnings: number }>>([])
  const [deliveryStatsData, setDeliveryStatsData] = useState<
    Array<{ date: string; completed: number; cancelled: number; total: number }>
  >([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    rating: 0,
    totalRatings: 0,
    onTimeRate: 0,
    completionRate: 0,
    acceptanceRate: 0,
    averageDeliveryTime: 0,
  })
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [earningsChange, setEarningsChange] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [userId, userType, period])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      let startDate: Date

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      // Fetch deliveries
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*")
        .eq(userType === "driver" ? "driver_id" : "customer_id", userId)
        .gte("created_at", startDate.toISOString())

      if (deliveries) {
        // Process earnings data
        const earningsMap = new Map<string, number>()
        const deliveryStatsMap = new Map<string, { completed: number; cancelled: number; total: number }>()

        deliveries.forEach((delivery) => {
          const date = new Date(delivery.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })

          // Earnings (driver gets 60% of delivery fee)
          const earnings = userType === "driver" ? delivery.delivery_fee * 0.6 : delivery.delivery_fee
          earningsMap.set(date, (earningsMap.get(date) || 0) + earnings)

          // Delivery stats
          const stats = deliveryStatsMap.get(date) || { completed: 0, cancelled: 0, total: 0 }
          stats.total++
          if (delivery.status === "delivered") stats.completed++
          if (delivery.status === "cancelled") stats.cancelled++
          deliveryStatsMap.set(date, stats)
        })

        // Convert to arrays
        const earningsArray = Array.from(earningsMap.entries())
          .map(([date, earnings]) => ({ date, earnings }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const deliveryStatsArray = Array.from(deliveryStatsMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setEarningsData(earningsArray)
        setDeliveryStatsData(deliveryStatsArray)

        // Calculate total earnings and change
        const total = earningsArray.reduce((sum, item) => sum + item.earnings, 0)
        setTotalEarnings(total)

        // Calculate change (compare to previous period)
        const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
        const { data: previousDeliveries } = await supabase
          .from("deliveries")
          .select("delivery_fee")
          .eq(userType === "driver" ? "driver_id" : "customer_id", userId)
          .gte("created_at", previousPeriodStart.toISOString())
          .lt("created_at", startDate.toISOString())

        const previousTotal =
          previousDeliveries?.reduce(
            (sum, d) => sum + (userType === "driver" ? d.delivery_fee * 0.6 : d.delivery_fee),
            0,
          ) || 0

        const change = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
        setEarningsChange(change)

        // Calculate performance metrics
        const completedDeliveries = deliveries.filter((d) => d.status === "delivered")
        const totalDeliveries = deliveries.length

        // Rating
        const deliveriesWithRatings = completedDeliveries.filter(
          (d) => (userType === "driver" ? d.driver_rating : d.customer_rating) !== null,
        )
        const avgRating =
          deliveriesWithRatings.length > 0
            ? deliveriesWithRatings.reduce(
                (sum, d) => sum + (userType === "driver" ? d.driver_rating : d.customer_rating),
                0,
              ) / deliveriesWithRatings.length
            : 0

        // On-time rate
        const onTimeDeliveries = completedDeliveries.filter((d) => {
          if (!d.estimated_delivery || !d.delivered_at) return false
          return new Date(d.delivered_at).getTime() <= new Date(d.estimated_delivery).getTime()
        })
        const onTimeRate =
          completedDeliveries.length > 0 ? (onTimeDeliveries.length / completedDeliveries.length) * 100 : 0

        // Completion rate
        const completionRate = totalDeliveries > 0 ? (completedDeliveries.length / totalDeliveries) * 100 : 0

        // Acceptance rate (for drivers)
        const acceptedDeliveries = deliveries.filter((d) => d.status !== "cancelled")
        const acceptanceRate = totalDeliveries > 0 ? (acceptedDeliveries.length / totalDeliveries) * 100 : 0

        // Average delivery time
        const deliveryTimes = completedDeliveries
          .filter((d) => d.created_at && d.delivered_at)
          .map((d) => (new Date(d.delivered_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60))
        const avgDeliveryTime =
          deliveryTimes.length > 0 ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length : 0

        setPerformanceMetrics({
          rating: avgRating,
          totalRatings: deliveriesWithRatings.length,
          onTimeRate: Math.round(onTimeRate),
          completionRate: Math.round(completionRate),
          acceptanceRate: Math.round(acceptanceRate),
          averageDeliveryTime: Math.round(avgDeliveryTime),
        })
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being generated...",
    })
    // In a real app, this would generate a CSV or PDF
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400 text-sm">Track your performance and earnings</p>
        </div>
        <Button
          onClick={exportData}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "year")}>
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Charts */}
      <div className="space-y-6">
        <EarningsChart data={earningsData} period={period} totalEarnings={totalEarnings} change={earningsChange} />
        <DeliveryStatsChart data={deliveryStatsData} />
        <PerformanceMetrics {...performanceMetrics} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400 mb-1">Total Deliveries</p>
            <p className="text-2xl font-bold text-white">{deliveryStatsData.reduce((sum, d) => sum + d.total, 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-white">{performanceMetrics.completionRate}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
