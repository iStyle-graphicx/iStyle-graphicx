"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"

interface DeliveryArea {
  name: string
  lat: number
  lng: number
  description: string
}

const deliveryAreas: DeliveryArea[] = [
  {
    name: "Mabopane",
    lat: -25.4989,
    lng: 28.0989,
    description: "Full coverage including Phase 1, 2, 3 and extensions",
  },
  { name: "Ga-Rankuwa", lat: -25.6167, lng: 27.9833, description: "All zones including Industrial area" },
  { name: "Soshanguve", lat: -25.4833, lng: 28.1, description: "All blocks including BB, CC, FF, GG and extensions" },
  { name: "Klipgat", lat: -25.45, lng: 27.95, description: "Township and surrounding areas" },
  { name: "Letlhabile", lat: -25.4, lng: 27.85, description: "Residential and commercial areas" },
  { name: "Mmakau", lat: -25.55, lng: 27.75, description: "Village and surrounding farms" },
  { name: "Mothotlung", lat: -25.35, lng: 27.8, description: "Residential areas" },
  { name: "Hebron", lat: -25.5, lng: 27.9, description: "Township and industrial area" },
  { name: "Erasmus", lat: -25.6, lng: 27.8, description: "Agricultural and residential areas" },
  { name: "Rosslyn", lat: -25.65, lng: 28.05, description: "Industrial hub and residential areas" },
  { name: "Pretoria Town", lat: -25.7479, lng: 28.2293, description: "CBD and surrounding suburbs" },
  { name: "Winterveldt", lat: -25.3833, lng: 28.0167, description: "All sections including extensions" },
  { name: "Kgabalatsane", lat: -25.42, lng: 27.92, description: "Residential areas" },
  { name: "Orchards", lat: -25.7, lng: 28.25, description: "Suburban residential area" },
]

export function InteractiveDeliveryMap() {
  const [selectedArea, setSelectedArea] = useState<DeliveryArea | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  const getNearestArea = () => {
    if (!userLocation) return null

    let nearest = deliveryAreas[0]
    let minDistance = calculateDistance(userLocation.lat, userLocation.lng, nearest.lat, nearest.lng)

    deliveryAreas.forEach((area) => {
      const distance = calculateDistance(userLocation.lat, userLocation.lng, area.lat, area.lng)
      if (distance < minDistance) {
        minDistance = distance
        nearest = area
      }
    })

    return { area: nearest, distance: minDistance }
  }

  const nearestArea = getNearestArea()

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Interactive Delivery Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Map Container */}
          <div className="relative w-full h-96 bg-slate-800 rounded-lg overflow-hidden border border-white/10">
            {/* SVG Map */}
            <svg viewBox="0 0 800 600" className="w-full h-full">
              {/* Background */}
              <rect width="800" height="600" fill="#1e293b" />

              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Delivery areas as circles */}
              {deliveryAreas.map((area, index) => {
                // Convert lat/lng to SVG coordinates (simplified projection)
                const x = ((area.lng - 27.5) / 1.0) * 800
                const y = ((area.lat + 26.0) / 1.5) * 600

                const isSelected = selectedArea?.name === area.name
                const isNearest = nearestArea?.area.name === area.name

                return (
                  <g key={index}>
                    {/* Area circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 25 : 15}
                      fill={isSelected ? "#f97316" : isNearest ? "#22c55e" : "#64748b"}
                      opacity={isSelected ? 0.8 : 0.6}
                      className="cursor-pointer transition-all duration-300 hover:opacity-100"
                      onClick={() => setSelectedArea(area)}
                    />

                    {/* Coverage radius */}
                    <circle
                      cx={x}
                      cy={y}
                      r={50}
                      fill="none"
                      stroke={isSelected ? "#f97316" : isNearest ? "#22c55e" : "#64748b"}
                      strokeWidth="1"
                      opacity="0.3"
                      strokeDasharray="5,5"
                    />

                    {/* Area label */}
                    <text
                      x={x}
                      y={y - 30}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight={isSelected ? "bold" : "normal"}
                      className="pointer-events-none"
                    >
                      {area.name}
                    </text>
                  </g>
                )
              })}

              {/* User location marker */}
              {userLocation && (
                <g>
                  <circle
                    cx={((userLocation.lng - 27.5) / 1.0) * 800}
                    cy={((userLocation.lat + 26.0) / 1.5) * 600}
                    r="8"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={((userLocation.lng - 27.5) / 1.0) * 800}
                    y={((userLocation.lat + 26.0) / 1.5) * 600 - 15}
                    textAnchor="middle"
                    fill="#3b82f6"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    You
                  </text>
                </g>
              )}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-white">Selected Area</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-white">Nearest to You</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-white">Delivery Area</span>
                </div>
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span className="text-white">Your Location</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Area Info */}
          {selectedArea && (
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{selectedArea.name}</h4>
                  <p className="text-sm text-gray-300">{selectedArea.description}</p>
                  {userLocation && (
                    <p className="text-xs text-gray-400 mt-2">
                      Distance from you:{" "}
                      {calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        selectedArea.lat,
                        selectedArea.lng,
                      ).toFixed(1)}{" "}
                      km
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nearest Area Info */}
          {nearestArea && !selectedArea && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Navigation className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Nearest Delivery Area</h4>
                  <p className="text-sm text-gray-300">{nearestArea.area.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {nearestArea.distance.toFixed(1)} km away • {nearestArea.area.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mt-4">
            Click on any area to view details. We deliver to all highlighted areas across Pretoria and surrounding
            regions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
