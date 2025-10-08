"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, Warehouse, Home, Building, Factory } from "lucide-react"

export function ServicesSection() {
  const serviceAreas = [
    { icon: HardHat, title: "Construction Sites", description: "Timely delivery of materials to construction sites" },
    { icon: Warehouse, title: "Warehouses", description: "Efficient logistics for warehouse operations" },
    { icon: Home, title: "Residential Locations", description: "Safe and secure delivery to homes" },
    { icon: Building, title: "Downtown Areas", description: "Urban delivery solutions" },
    { icon: Factory, title: "Industrial Zones", description: "Heavy-duty delivery for industrial needs" },
  ]

  const deliveryOptions = [
    { name: "Standard Delivery", time: "Within 24-48 hours", price: "From R50" },
    { name: "Express Delivery", time: "Same day delivery", price: "From R100" },
    { name: "Emergency Delivery", time: "Within 2-4 hours", price: "From R150" },
  ]

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Our Services</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Service Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            We deliver across the metro area with same-day delivery to various locations.
          </p>

          <div className="space-y-4">
            {serviceAreas.map((area, index) => {
              const Icon = area.icon
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{area.title}</h4>
                    <p className="text-sm text-gray-300">{area.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Delivery Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveryOptions.map((option, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-white">{option.name}</h4>
                  <p className="text-sm text-gray-300">{option.time}</p>
                </div>
                <span className="font-semibold text-white">{option.price}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
