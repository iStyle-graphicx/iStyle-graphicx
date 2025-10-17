"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { InteractiveDeliveryMap } from "@/components/interactive-delivery-map"

export function DeliveryAreasSection() {
  const deliveryAreas = [
    { name: "Mabopane", description: "Full coverage including Phase 1, 2, 3 and extensions" },
    { name: "Ga-Rankuwa", description: "All zones including Industrial area" },
    { name: "Soshanguve", description: "All blocks including BB, CC, FF, GG and extensions" },
    { name: "Klipgat", description: "Township and surrounding areas" },
    { name: "Letlhabile", description: "Residential and commercial areas" },
    { name: "Mmakau", description: "Village and surrounding farms" },
    { name: "Mothotlung", description: "Residential areas" },
    { name: "Hebron", description: "Township and industrial area" },
    { name: "Erasmus", description: "Agricultural and residential areas" },
    { name: "Rosslyn", description: "Industrial hub and residential areas" },
    { name: "Pretoria Town", description: "CBD and surrounding suburbs" },
    { name: "Winterveldt", description: "All sections including extensions" },
    { name: "Kgabalatsane", description: "Residential areas" },
    { name: "Orchards", description: "Suburban residential area" },
  ]

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Delivery Areas</h2>

      <InteractiveDeliveryMap />

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">We Deliver To These Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deliveryAreas.map((area, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-white w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{area.name}</h4>
                  <p className="text-sm text-gray-300">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
