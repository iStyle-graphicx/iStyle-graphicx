// Pretoria coordinates and areas
export const PRETORIA_CENTER = {
  lat: -25.7479,
  lng: 28.2293,
}

export const PRETORIA_AREAS = [
  { name: "Pretoria CBD", lat: -25.7479, lng: 28.2293, zone: "central" },
  { name: "Centurion", lat: -25.8601, lng: 28.1888, zone: "south" },
  { name: "Hatfield", lat: -25.7506, lng: 28.2378, zone: "central" },
  { name: "Brooklyn", lat: -25.7615, lng: 28.2367, zone: "central" },
  { name: "Menlyn", lat: -25.7847, lng: 28.2773, zone: "east" },
  { name: "Wonderboom", lat: -25.7089, lng: 28.2089, zone: "north" },
  { name: "Sunnyside", lat: -25.7456, lng: 28.2156, zone: "central" },
  { name: "Arcadia", lat: -25.7378, lng: 28.2089, zone: "central" },
  { name: "Lynnwood", lat: -25.7667, lng: 28.3167, zone: "east" },
  { name: "Garsfontein", lat: -25.8167, lng: 28.3167, zone: "east" },
]

export const DELIVERY_ZONES = {
  central: { color: "#f97316", name: "Central Pretoria", baseRate: 35 },
  north: { color: "#3b82f6", name: "Northern Suburbs", baseRate: 40 },
  south: { color: "#10b981", name: "Southern Areas", baseRate: 45 },
  east: { color: "#8b5cf6", name: "Eastern Suburbs", baseRate: 42 },
}

export interface DeliveryLocation {
  id: string
  address: string
  lat: number
  lng: number
  type: "pickup" | "dropoff"
  zone: keyof typeof DELIVERY_ZONES
}

export interface DeliveryRoute {
  id: string
  pickup: DeliveryLocation
  dropoff: DeliveryLocation
  distance: number
  duration: number
  cost: number
  status: "pending" | "active" | "completed"
}
