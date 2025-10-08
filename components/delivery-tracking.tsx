"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InteractiveMap } from "./interactive-map"
import { realtimeClient } from "@/lib/realtime-client"
import type { DeliveryLocation } from "@/lib/map-config"
import {
  MapPin,
  Clock,
  Truck,
  Package,
  CheckCircle,
  Phone,
  MessageCircle,
  Navigation,
  Star,
  AlertCircle,
} from "lucide-react"

interface DeliveryTrackingProps {
  deliveryId: string
  customerId: string
}

export function DeliveryTracking({ deliveryId, customerId }: DeliveryTrackingProps) {
  const [delivery, setDelivery] = useState({
    id: deliveryId,
    status: "in_transit",
    pickup: {
      id: "pickup-1",
      address: "123 Church Street, Pretoria CBD",
      lat: -25.7479,
      lng: 28.2293,
      type: "pickup" as const,
      zone: "central" as const,
    },
    dropoff: {
      id: "dropoff-1",
      address: "456 Lynnwood Road, Lynnwood",
      lat: -25.7667,
      lng: 28.3167,
      type: "dropoff" as const,
      zone: "east" as const,
    },
    driver: {
      id: "driver-123",
      name: "Thabo Mthembu",
      phone: "+27 82 123 4567",
      rating: 4.8,
      vehicle: "Toyota Hilux - GP 123 ABC",
      photo: "/african-male-driver.jpg",
    },
    estimatedArrival: "15:30",
    distance: "12.5 km",
    cost: 450,
  })

  const [driverLocation, setDriverLocation] = useState({
    lat: -25.7523,
    lng: 28.2456,
  })

  const [trackingHistory, setTrackingHistory] = useState([
    {
      id: "1",
      status: "confirmed",
      message: "Delivery request confirmed",
      timestamp: "14:00",
      completed: true,
    },
    {
      id: "2",
      status: "driver_assigned",
      message: "Driver assigned and en route to pickup",
      timestamp: "14:15",
      completed: true,
    },
    {
      id: "3",
      status: "picked_up",
      message: "Items picked up successfully",
      timestamp: "14:45",
      completed: true,
    },
    {
      id: "4",
      status: "in_transit",
      message: "On the way to delivery location",
      timestamp: "15:00",
      completed: false,
    },
    {
      id: "5",
      status: "delivered",
      message: "Delivery completed",
      timestamp: "15:30",
      completed: false,
    },
  ])

  useEffect(() => {
    // Connect to real-time updates
    realtimeClient.connect(customerId)

    realtimeClient.on("delivery_update", (update: any) => {
      if (update.id === deliveryId) {
        setDelivery((prev) => ({ ...prev, status: update.status }))
        if (update.location) {
          setDriverLocation(update.location)
        }
      }
    })

    // Simulate driver movement
    const moveDriver = () => {
      setDriverLocation((prev) => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }))
    }

    const interval = setInterval(moveDriver, 5000)

    return () => {
      clearInterval(interval)
      realtimeClient.disconnect()
    }
  }, [deliveryId, customerId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500"
      case "driver_assigned":
        return "bg-yellow-500"
      case "picked_up":
        return "bg-orange-500"
      case "in_transit":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const deliveryLocations: DeliveryLocation[] = [delivery.pickup, delivery.dropoff]

  return (
    <div className="space-y-6">
      {/* Delivery Status Header */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Delivery #{deliveryId.slice(-6)}
            </CardTitle>
            <Badge className={`${getStatusColor(delivery.status)} text-white`}>
              {delivery.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Estimated Arrival</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4 text-green-500" />
                {delivery.estimatedArrival}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Distance</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <Navigation className="w-4 h-4 text-blue-500" />
                {delivery.distance}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InteractiveMap
            deliveries={deliveryLocations}
            showRoute={true}
            driverLocation={driverLocation}
            className="h-[300px]"
          />
        </CardContent>
      </Card>

      {/* Driver Information */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            Your Driver
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <img
              src={delivery.driver.photo || "/placeholder.svg"}
              alt={delivery.driver.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
            />
            <div className="flex-1">
              <h4 className="text-white font-semibold">{delivery.driver.name}</h4>
              <p className="text-gray-400 text-sm">{delivery.driver.vehicle}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-white text-sm">{delivery.driver.rating}</span>
                <span className="text-gray-400 text-sm">(248 reviews)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500/10 bg-transparent"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Delivery Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackingHistory.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.completed
                        ? "bg-green-500"
                        : index === trackingHistory.findIndex((e) => !e.completed)
                          ? "bg-orange-500"
                          : "bg-gray-500"
                    }`}
                  />
                  {index < trackingHistory.length - 1 && (
                    <div className={`w-0.5 h-8 ${event.completed ? "bg-green-500" : "bg-gray-600"}`} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${event.completed ? "text-white" : "text-gray-400"}`}>{event.message}</p>
                    <span className="text-sm text-gray-400">{event.timestamp}</span>
                  </div>
                  {event.completed && <CheckCircle className="w-4 h-4 text-green-500 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Locations */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500 mt-2" />
              <div>
                <p className="text-sm text-gray-400">Pickup Location</p>
                <p className="text-white font-medium">{delivery.pickup.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm text-gray-400">Delivery Location</p>
                <p className="text-white font-medium">{delivery.dropoff.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-white font-medium">Need Help?</p>
              <p className="text-gray-300 text-sm">Contact our 24/7 support team</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent"
            >
              Call Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
