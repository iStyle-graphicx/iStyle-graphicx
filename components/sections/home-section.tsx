"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Wrench, Warehouse, Zap } from "lucide-react"

interface HomeSectionProps {
  onRequestDelivery: () => void
  onLearnMore: () => void
}

export function HomeSection({ onRequestDelivery, onLearnMore }: HomeSectionProps) {
  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-orange-500 font-semibold text-sm uppercase tracking-wide mb-2">Premium Delivery</p>
        <h2 className="text-3xl font-extrabold leading-tight mb-4">
          Hardware Material <br />
          <span className="text-orange-500">Delivery Made Simple</span>
        </h2>
        <p className="text-gray-300 text-base mb-6">
          VanGo connects you with reliable drivers for seamless transportation of your hardware materials. From cement
          to metal sheets, we've got your delivery needs covered.
        </p>

        <div className="flex space-x-4 mb-8">
          <Button
            onClick={onRequestDelivery}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex-1"
          >
            Request Delivery
          </Button>
          <Button
            onClick={onLearnMore}
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-slate-900 px-6 py-3 rounded-lg font-semibold flex-1 bg-transparent"
          >
            Learn More
          </Button>
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-white">Request a Delivery</h4>
              <p className="text-gray-300 text-sm">Enter your delivery details and material information.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-white">Get Matched</h4>
              <p className="text-gray-300 text-sm">Our system finds the best driver for your needs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-white">Track in Real-Time</h4>
              <p className="text-gray-300 text-sm">Monitor your delivery from pickup to destination.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-center">
              <Package className="text-orange-500 text-2xl mb-2 mx-auto" />
              <p className="text-sm text-white">Construction Materials</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-center">
              <Wrench className="text-orange-500 text-2xl mb-2 mx-auto" />
              <p className="text-sm text-white">Tools & Equipment</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-center">
              <Warehouse className="text-orange-500 text-2xl mb-2 mx-auto" />
              <p className="text-sm text-white">Bulk Deliveries</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-center">
              <Zap className="text-orange-500 text-2xl mb-2 mx-auto" />
              <p className="text-sm text-white">Emergency Deliveries</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
