"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function TrackDeliverySection() {
  const [trackingCode, setTrackingCode] = useState("")
  const [trackingResult, setTrackingResult] = useState<any>(null)
  const { toast } = useToast()

  const sampleDeliveries = [
    {
      trackingCode: "VAN123456",
      status: "In Transit",
      eta: "25 minutes",
      progress: 65,
      destination: "123 Construction Site, Johannesburg",
      date: "2023-05-15",
    },
    {
      trackingCode: "VAN789012",
      status: "Delivered",
      eta: "Delivered",
      progress: 100,
      destination: "456 Builder St, Pretoria",
      date: "2023-05-10",
    },
    {
      trackingCode: "VAN345678",
      status: "Pending",
      eta: "1 hour",
      progress: 20,
      destination: "789 Hardware Store, Cape Town",
      date: "2023-05-18",
    },
  ]

  const handleTrack = () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code",
        variant: "destructive",
      })
      return
    }

    const delivery = sampleDeliveries.find((d) => d.trackingCode === trackingCode)

    if (delivery) {
      setTrackingResult(delivery)
      toast({
        title: "Tracking found!",
        description: `Status: ${delivery.status}`,
      })
    } else {
      toast({
        title: "Not found",
        description: "Tracking code not found",
        variant: "destructive",
      })
      setTrackingResult(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-500"
      case "In Transit":
        return "text-orange-500"
      case "Pending":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Track Delivery</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Enter Tracking Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Enter tracking code"
              className="flex-grow bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleTrack}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold"
            >
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {trackingResult && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Delivery Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Tracking Code:</span>
                <span className="font-medium text-white">{trackingResult.trackingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${getStatusColor(trackingResult.status)}`}>{trackingResult.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Arrival:</span>
                <span className="font-medium text-white">{trackingResult.eta}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{trackingResult.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${trackingResult.progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleDeliveries.map((delivery) => (
              <div
                key={delivery.trackingCode}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  setTrackingCode(delivery.trackingCode)
                  setTrackingResult(delivery)
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">{delivery.trackingCode}</div>
                    <div className="text-sm text-gray-400">To: {delivery.destination}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${getStatusColor(delivery.status)}`}>{delivery.status}</div>
                    <div className="text-xs text-gray-400">{delivery.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
