"use client"

import { useEffect, useRef, useState } from "react"
import { PRETORIA_CENTER, PRETORIA_AREAS, DELIVERY_ZONES, type DeliveryLocation } from "@/lib/map-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Truck } from "lucide-react"

interface InteractiveMapProps {
  deliveries?: DeliveryLocation[]
  showRoute?: boolean
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void
  driverLocation?: { lat: number; lng: number }
  className?: string
}

export function InteractiveMap({
  deliveries = [],
  showRoute = false,
  onLocationSelect,
  driverLocation,
  className = "",
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    const loadLeaflet = () => {
      if ((window as any).L) {
        initializeMap()
        return
      }

      // Load Leaflet CSS
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(cssLink)

      // Load Leaflet JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current || !(window as any).L) return

      console.log("[v0] Initializing Leaflet map")

      const L = (window as any).L
      const mapInstance = L.map(mapRef.current, {
        center: [PRETORIA_CENTER.lat, PRETORIA_CENTER.lng],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      })

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance)

      setMap(mapInstance)
      setIsLoaded(true)

      // Add click listener for location selection
      if (onLocationSelect) {
        mapInstance.on("click", (event: any) => {
          const lat = event.latlng.lat
          const lng = event.latlng.lng

          // Simple reverse geocoding using Nominatim (free)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then((response) => response.json())
            .then((data) => {
              onLocationSelect({
                lat,
                lng,
                address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              })
            })
            .catch(() => {
              onLocationSelect({
                lat,
                lng,
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              })
            })
        })
      }

      console.log("[v0] Leaflet map initialized successfully")
    }

    loadLeaflet()
  }, [onLocationSelect])

  useEffect(() => {
    if (!map || !isLoaded) return

    const L = (window as any).L
    if (!L) return

    console.log("[v0] Adding markers to map")

    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    // Add Pretoria area markers
    PRETORIA_AREAS.forEach((area) => {
      const marker = L.circleMarker([area.lat, area.lng], {
        radius: 8,
        fillColor: DELIVERY_ZONES[area.zone as keyof typeof DELIVERY_ZONES].color,
        fillOpacity: 0.8,
        color: "#ffffff",
        weight: 2,
      }).addTo(map)

      marker.bindPopup(area.name)
      marker.on("click", () => {
        setSelectedArea(area.name)
      })

      markersRef.current.push(marker)
    })

    // Add delivery markers
    deliveries.forEach((delivery) => {
      const color = delivery.type === "pickup" ? "#f97316" : "#10b981"
      const marker = L.marker([delivery.lat, delivery.lng], {
        icon: L.divIcon({
          html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: "custom-div-icon",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map)

      marker.bindPopup(delivery.address)
      markersRef.current.push(marker)
    })

    // Add driver location if provided
    if (driverLocation) {
      const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: L.divIcon({
          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; transform: rotate(45deg);"></div>`,
          className: "custom-div-icon",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(map)

      driverMarker.bindPopup("Driver Location")
      markersRef.current.push(driverMarker)
    }

    // Draw route if requested (simplified polyline)
    if (showRoute && deliveries.length >= 2) {
      const routePoints = deliveries.map((d) => [d.lat, d.lng])
      const polyline = L.polyline(routePoints, {
        color: "#f97316",
        weight: 4,
        opacity: 0.8,
      }).addTo(map)

      markersRef.current.push(polyline)
    }

    console.log("[v0] Added", markersRef.current.length, "markers to map")
  }, [map, isLoaded, deliveries, showRoute, driverLocation])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg overflow-hidden" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-gray-300">Loading Pretoria map...</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <Card className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border-slate-700">
        <CardContent className="p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Delivery Zones</h4>
          <div className="space-y-1">
            {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></div>
                <span className="text-gray-300">{zone.name}</span>
                <Badge variant="secondary" className="text-xs">
                  R{zone.baseRate}/km
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Area Info */}
      {selectedArea && (
        <Card className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-white">{selectedArea}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedArea(null)}
              className="text-xs border-slate-600 text-gray-300 hover:bg-slate-800 bg-transparent"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => map?.setView([PRETORIA_CENTER.lat, PRETORIA_CENTER.lng], 11)}
          className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-800"
        >
          <Navigation className="w-4 h-4" />
        </Button>
        {driverLocation && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => map?.setView([driverLocation.lat, driverLocation.lng], 13)}
            className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-800"
          >
            <Truck className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
