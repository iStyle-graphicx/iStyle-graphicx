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

  useEffect(() => {
    const loadGoogleMaps = () => {
      if ((window as any).google) {
        initializeMap()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "demo_key"}&libraries=places,geometry`
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
        center: PRETORIA_CENTER,
        zoom: 11,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#1f2937" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#374151" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#4b5563" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca3af" }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      setMap(mapInstance)
      setIsLoaded(true)

      // Add click listener for location selection
      if (onLocationSelect) {
        mapInstance.addListener("click", (event: any) => {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()

          // Reverse geocode to get address
          const geocoder = new (window as any).google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === "OK" && results[0]) {
              onLocationSelect({
                lat,
                lng,
                address: results[0].formatted_address,
              })
            }
          })
        })
      }
    }

    loadGoogleMaps()
  }, [onLocationSelect])

  useEffect(() => {
    if (!map || !isLoaded) return

    // Clear existing markers
    // In a real implementation, you'd track and clear markers properly

    // Add Pretoria area markers
    PRETORIA_AREAS.forEach((area) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: area.lat, lng: area.lng },
        map: map,
        title: area.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: DELIVERY_ZONES[area.zone as keyof typeof DELIVERY_ZONES].color,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        setSelectedArea(area.name)
      })
    })

    // Add delivery markers
    deliveries.forEach((delivery) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: delivery.lat, lng: delivery.lng },
        map: map,
        title: delivery.address,
        icon: {
          path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: delivery.type === "pickup" ? "#f97316" : "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1,
        },
      })
    })

    // Add driver location if provided
    if (driverLocation) {
      ;new (window as any).google.maps.Marker({
        position: driverLocation,
        map: map,
        title: "Driver Location",
        icon: {
          path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          rotation: 45,
        },
      })
    }

    // Draw route if requested
    if (showRoute && deliveries.length >= 2) {
      const directionsService = new (window as any).google.maps.DirectionsService()
      const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "#f97316",
          strokeWeight: 4,
        },
        suppressMarkers: true,
      })

      directionsRenderer.setMap(map)

      const waypoints = deliveries.slice(1, -1).map((delivery) => ({
        location: { lat: delivery.lat, lng: delivery.lng },
        stopover: true,
      }))

      directionsService.route(
        {
          origin: { lat: deliveries[0].lat, lng: deliveries[0].lng },
          destination: { lat: deliveries[deliveries.length - 1].lat, lng: deliveries[deliveries.length - 1].lng },
          waypoints: waypoints,
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === "OK") {
            directionsRenderer.setDirections(result)
          }
        },
      )
    }
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
          onClick={() => map?.setCenter(PRETORIA_CENTER)}
          className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-800"
        >
          <Navigation className="w-4 h-4" />
        </Button>
        {driverLocation && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => map?.setCenter(driverLocation)}
            className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-800"
          >
            <Truck className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
