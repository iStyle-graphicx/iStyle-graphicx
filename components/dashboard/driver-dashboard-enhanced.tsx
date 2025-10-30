"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  DollarSign,
  Star,
  Navigation,
  CheckCircle,
  TrendingUp,
  Clock,
  Package,
  Activity,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DriverDashboardEnhancedProps {
  user: any
  onNavigate?: (section: string) => void
}

export function DriverDashboardEnhanced({ user, onNavigate }: DriverDashboardEnhancedProps) {
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalEarnings: 0,
    totalDeliveries: 0,
    todayDeliveries: 0,
    rating: 0,
    acceptanceRate: 0,
    completionRate: 0,
    isOnline: false,
  })
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDriverData()
      const channel = supabase
        .channel("driver_jobs")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "deliveries",
            filter: "status=eq.pending",
          },
          (payload) => {
            const newJob = payload.new
            setAvailableJobs((prev) => [newJob, ...prev])
            toast({
              title: "New Delivery Request",
              description: `New delivery from ${newJob.pickup_address}`,
            })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "deliveries",
            filter: `driver_id=eq.${user.id}`,
          },
          () => {
            fetchDriverData()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchDriverData = async () => {
    try {
      setIsLoading(true)

      // Fetch driver stats
      const { data: driverData } = await supabase.from("drivers").select("*").eq("id", user.id).single()

      if (driverData) {
        // Fetch deliveries for earnings calculation
        const { data: deliveries } = await supabase
          .from("deliveries")
          .select("*")
          .eq("driver_id", user.id)
          .eq("status", "delivered")

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const todayDeliveries = deliveries?.filter((d) => new Date(d.delivered_at) >= todayStart) || []
        const weekDeliveries = deliveries?.filter((d) => new Date(d.delivered_at) >= weekStart) || []
        const monthDeliveries = deliveries?.filter((d) => new Date(d.delivered_at) >= monthStart) || []

        // Driver gets 60% of delivery fee
        const todayEarnings = todayDeliveries.reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)
        const weekEarnings = weekDeliveries.reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)
        const monthEarnings = monthDeliveries.reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)

        // Calculate rates
        const { data: allDriverDeliveries } = await supabase
          .from("deliveries")
          .select("status")
          .eq("driver_id", user.id)

        const totalRequests = allDriverDeliveries?.length || 0
        const completed = allDriverDeliveries?.filter((d) => d.status === "delivered").length || 0
        const accepted = allDriverDeliveries?.filter((d) => d.status !== "cancelled").length || 0

        setStats({
          todayEarnings,
          weekEarnings,
          monthEarnings,
          totalEarnings: driverData.total_earnings || 0,
          totalDeliveries: driverData.total_deliveries || 0,
          todayDeliveries: todayDeliveries.length,
          rating: driverData.rating || 0,
          acceptanceRate: totalRequests > 0 ? Math.round((accepted / totalRequests) * 100) : 0,
          completionRate: accepted > 0 ? Math.round((completed / accepted) * 100) : 0,
          isOnline: driverData.is_online || false,
        })
      }

      // Fetch active jobs
      const { data: activeJobsData } = await supabase
        .from("deliveries")
        .select("*")
        .eq("driver_id", user.id)
        .in("status", ["accepted", "in_transit"])

      setActiveJobs(activeJobsData || [])

      // Fetch available jobs (only if driver is online)
      if (driverData?.is_online) {
        const { data: availableJobsData } = await supabase
          .from("deliveries")
          .select("*")
          .eq("status", "pending")
          .is("driver_id", null)
          .limit(10)

        setAvailableJobs(availableJobsData || [])
      }
    } catch (error) {
      console.error("Error fetching driver data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOnlineStatus = async () => {
    const newStatus = !stats.isOnline
    const { error } = await supabase.from("drivers").update({ is_online: newStatus }).eq("id", user.id)

    if (!error) {
      setStats((prev) => ({ ...prev, isOnline: newStatus }))
      toast({
        title: newStatus ? "You're Online" : "You're Offline",
        description: newStatus ? "You can now receive delivery requests" : "You won't receive new requests",
      })
      if (newStatus) {
        fetchDriverData()
      } else {
        setAvailableJobs([])
      }
    }
  }

  const acceptJob = async (jobId: string) => {
    const { error } = await supabase
      .from("deliveries")
      .update({
        driver_id: user.id,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (!error) {
      const job = availableJobs.find((j) => j.id === jobId)
      if (job) {
        setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId))
        setActiveJobs((prev) => [...prev, { ...job, status: "accepted" }])
        toast({
          title: "Job Accepted",
          description: "Navigate to pickup location to start delivery",
        })
      }
    }
  }

  const completeJob = async (jobId: string) => {
    const { error } = await supabase
      .from("deliveries")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (!error) {
      const job = activeJobs.find((j) => j.id === jobId)
      if (job) {
        const driverPayout = job.delivery_fee * 0.6
        await supabase
          .from("drivers")
          .update({
            total_earnings: stats.totalEarnings + driverPayout,
            total_deliveries: stats.totalDeliveries + 1,
          })
          .eq("id", user.id)

        setActiveJobs((prev) => prev.filter((j) => j.id !== jobId))
        toast({
          title: "Delivery Completed",
          description: `You earned R${driverPayout.toFixed(2)}`,
        })
        fetchDriverData()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Driver Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage your deliveries and earnings</p>
        </div>
        <Button
          onClick={toggleOnlineStatus}
          className={stats.isOnline ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
        >
          {stats.isOnline ? "Go Offline" : "Go Online"}
        </Button>
      </div>

      {/* Online Status Banner */}
      {!stats.isOnline && (
        <Card className="bg-yellow-500/20 border-yellow-500/30">
          <CardContent className="p-4">
            <p className="text-yellow-400 text-sm">
              You're currently offline. Go online to start receiving delivery requests.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Earnings Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{stats.todayEarnings.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Today's Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.todayDeliveries}</p>
                <p className="text-xs text-gray-400">Today's Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{stats.weekEarnings.toFixed(0)}</p>
                <p className="text-xs text-gray-400">This Week</p>
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
                <p className="text-2xl font-bold text-white">{stats.rating.toFixed(1)}</p>
                <p className="text-xs text-gray-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Acceptance Rate</span>
              <span className="text-sm font-semibold text-white">{stats.acceptanceRate}%</span>
            </div>
            <Progress value={stats.acceptanceRate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Completion Rate</span>
              <span className="text-sm font-semibold text-white">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <p className="text-xs text-gray-400">Total Deliveries</p>
              <p className="text-lg font-bold text-white">{stats.totalDeliveries}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Earnings</p>
              <p className="text-lg font-bold text-white">R{stats.totalEarnings.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Management Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10">
          <TabsTrigger value="active">Active Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="available">Available Jobs ({availableJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeJobs.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300">No active jobs</p>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.isOnline ? "Check available jobs to get started" : "Go online to receive requests"}
                </p>
              </CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <Card key={job.id} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-2">
                        {job.status === "accepted" ? "Accepted" : "In Transit"}
                      </Badge>
                      <p className="text-white font-medium">{job.item_description}</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">R{(job.delivery_fee * 0.6).toFixed(0)}</p>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="truncate">{job.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="truncate">{job.delivery_address}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </Button>
                    {job.status === "accepted" && (
                      <Button
                        onClick={() => completeJob(job.id)}
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4 mt-4">
          {!stats.isOnline ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300">You're offline</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Go online to see available delivery requests</p>
                <Button onClick={toggleOnlineStatus} className="bg-green-500 hover:bg-green-600">
                  Go Online
                </Button>
              </CardContent>
            </Card>
          ) : availableJobs.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300">No available jobs</p>
                <p className="text-sm text-gray-400 mt-1">New delivery requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            availableJobs.map((job) => (
              <Card key={job.id} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium mb-1">{job.item_description}</p>
                      <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleTimeString()}</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">R{(job.delivery_fee * 0.6).toFixed(0)}</p>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="truncate">{job.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="truncate">{job.delivery_address}</span>
                    </div>
                  </div>

                  <Button onClick={() => acceptJob(job.id)} className="w-full bg-orange-500 hover:bg-orange-600">
                    Accept Job
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onNavigate?.("deliveryHistorySection")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2 bg-transparent"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">View History</span>
            </Button>

            <Button
              onClick={() => onNavigate?.("settingsSection")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2 bg-transparent"
            >
              <Activity className="w-6 h-6" />
              <span className="text-sm">Performance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
