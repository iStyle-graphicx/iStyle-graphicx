"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, Star, Navigation, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { InteractiveMap } from "./interactive-map"

interface DeliveryJob {
  id: string
  pickup_address: string
  delivery_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number
  delivery_lng: number
  item_description: string
  item_size: string
  item_weight: string
  delivery_fee: number
  status: string
  created_at: string
  customer_id: string
  distance?: number
  estimated_time?: number
}

interface DriverStats {
  total_earnings: number
  total_deliveries: number
  rating: number
  is_online: boolean
}

export function DriverDashboard({ driverId }: { driverId: string }) {
  const [activeJobs, setActiveJobs] = useState<DeliveryJob[]>([])
  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([])
  const [stats, setStats] = useState<DriverStats>({
    total_earnings: 0,
    total_deliveries: 0,
    rating: 0,
    is_online: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDriverData()
    setupRealTimeSubscriptions()
  }, [driverId])

  const fetchDriverData = async () => {
    setIsLoading(true)

    // Fetch driver stats
    const { data: driverData } = await supabase.from("drivers").select("*").eq("id", driverId).single()

    if (driverData) {
      setStats({
        total_earnings: driverData.total_earnings || 0,
        total_deliveries: driverData.total_deliveries || 0,
        rating: driverData.rating || 0,
        is_online: driverData.is_online || false,
      })
    }

    // Fetch active jobs
    const { data: activeJobsData } = await supabase
      .from("deliveries")
      .select("*")
      .eq("driver_id", driverId)
      .in("status", ["accepted", "in_progress"])

    if (activeJobsData) {
      setActiveJobs(activeJobsData)
    }

    // Fetch available jobs
    const { data: availableJobsData } = await supabase
      .from("deliveries")
      .select("*")
      .eq("status", "pending")
      .is("driver_id", null)
      .limit(10)

    if (availableJobsData) {
      // Calculate distance for each job (simplified calculation)
      const jobsWithDistance = availableJobsData.map((job) => ({
        ...job,
        distance: Math.round(Math.random() * 15 + 1), // Mock distance calculation
        estimated_time: Math.round(Math.random() * 30 + 10), // Mock time calculation
      }))
      setAvailableJobs(jobsWithDistance)
    }

    setIsLoading(false)
  }

  const setupRealTimeSubscriptions = () => {
    // Subscribe to new delivery requests
    const deliveryChannel = supabase
      .channel("delivery_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deliveries",
          filter: "status=eq.pending",
        },
        (payload) => {
          console.log("[v0] New delivery request:", payload)
          const newJob = {
            ...payload.new,
            distance: Math.round(Math.random() * 15 + 1),
            estimated_time: Math.round(Math.random() * 30 + 10),
          } as DeliveryJob
          setAvailableJobs((prev) => [newJob, ...prev])

          // Send notification to driver
          sendNotification(
            "New Delivery Request",
            `New delivery from ${newJob.pickup_address} to ${newJob.delivery_address}`,
            "delivery_request",
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(deliveryChannel)
    }
  }

  const sendNotification = async (title: string, message: string, type: string) => {
    await supabase.from("notifications").insert({
      user_id: driverId,
      title,
      message,
      type,
      is_read: false,
    })
  }

  const acceptJob = async (jobId: string) => {
    const { error } = await supabase
      .from("deliveries")
      .update({
        driver_id: driverId,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (!error) {
      // Move job from available to active
      const job = availableJobs.find((j) => j.id === jobId)
      if (job) {
        setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId))
        setActiveJobs((prev) => [...prev, { ...job, status: "accepted" }])

        // Send notification to customer
        await supabase.from("notifications").insert({
          user_id: job.customer_id,
          title: "Delivery Accepted",
          message: "Your delivery request has been accepted by a driver",
          type: "delivery_accepted",
          is_read: false,
        })
      }
    }
  }

  const completeJob = async (jobId: string) => {
    const { error } = await supabase
      .from("deliveries")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (!error) {
      const job = activeJobs.find((j) => j.id === jobId)
      if (job) {
        // Calculate driver payout (60% of delivery fee)
        const driverPayout = job.delivery_fee * 0.6

        // Update driver earnings
        await supabase
          .from("drivers")
          .update({
            total_earnings: stats.total_earnings + driverPayout,
            total_deliveries: stats.total_deliveries + 1,
          })
          .eq("id", driverId)

        setActiveJobs((prev) => prev.filter((j) => j.id !== jobId))
        setStats((prev) => ({
          ...prev,
          total_earnings: prev.total_earnings + driverPayout,
          total_deliveries: prev.total_deliveries + 1,
        }))

        // Send notifications
        await sendNotification(
          "Delivery Completed",
          `You earned R${driverPayout.toFixed(2)} for completing the delivery`,
          "payment_received",
        )

        await supabase.from("notifications").insert({
          user_id: job.customer_id,
          title: "Delivery Completed",
          message: "Your delivery has been completed successfully",
          type: "delivery_completed",
          is_read: false,
        })
      }
    }
  }

  const toggleOnlineStatus = async () => {
    const newStatus = !stats.is_online
    const { error } = await supabase.from("drivers").update({ is_online: newStatus }).eq("id", driverId)

    if (!error) {
      setStats((prev) => ({ ...prev, is_online: newStatus }))
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading driver dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">R{stats.total_earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Deliveries</p>
                <p className="text-2xl font-bold">{stats.total_deliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={stats.is_online ? "default" : "secondary"}>
                  {stats.is_online ? "Online" : "Offline"}
                </Badge>
              </div>
              <Button variant={stats.is_online ? "destructive" : "default"} size="sm" onClick={toggleOnlineStatus}>
                {stats.is_online ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Management */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">My Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="available">Find New Jobs ({availableJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active jobs</p>
              </CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Active Delivery</CardTitle>
                    <Badge variant="default">{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Pickup</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.pickup_address}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Delivery</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.delivery_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        <strong>Item:</strong> {job.item_description}
                      </span>
                      <span className="text-sm">
                        <strong>Fee:</strong> R{job.delivery_fee}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                      {job.status === "accepted" && (
                        <Button onClick={() => completeJob(job.id)} size="sm">
                          Complete Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableJobs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No available jobs at the moment</p>
              </CardContent>
            </Card>
          ) : (
            availableJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-sm">From</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.pickup_address}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-sm">To</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.delivery_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <strong>Item:</strong> {job.item_description}
                        </span>
                        <span>
                          <strong>Distance:</strong> {job.distance}km
                        </span>
                        <span>
                          <strong>Est. Time:</strong> {job.estimated_time}min
                        </span>
                        <span className="text-green-600 font-bold">R{job.delivery_fee}</span>
                      </div>
                    </div>

                    <Button onClick={() => acceptJob(job.id)} className="ml-4">
                      Accept Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <InteractiveMap
              center={[-25.7479, 28.2293]} // Pretoria coordinates
              deliveries={[...activeJobs, ...availableJobs]}
              showDriverLocation={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
