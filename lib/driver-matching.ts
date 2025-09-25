export interface MatchingCriteria {
  customerLocation: { lat: number; lng: number }
  deliveryLocation: { lat: number; lng: number }
  materialType: string
  weight: number
  urgency: "low" | "medium" | "high"
  maxDistance?: number
  minRating?: number
  preferredVehicleTypes?: string[]
}

export interface DriverScore {
  driverId: string
  score: number
  factors: {
    distance: number
    rating: number
    vehicleMatch: number
    availability: number
    experience: number
    loadBalance: number
  }
  estimatedArrival: number // minutes
  estimatedCost: number
}

export interface Driver {
  id: string
  name: string
  rating: number
  vehicle_type: string
  location: string
  distance: string
  status: "available" | "busy" | "offline"
  phone: string
  experience_years: number
  completed_deliveries: number
  avatar_url?: string
  lat?: number
  lng?: number
  current_jobs?: number
  specializations?: string[]
  last_delivery_time?: Date
}

class DriverMatchingEngine {
  private readonly VEHICLE_CAPACITY_MAP = {
    "Toyota Hilux": { maxWeight: 1000, suitableFor: ["cement", "bricks", "tools"] },
    "Isuzu Truck": { maxWeight: 3000, suitableFor: ["cement", "bricks", "timber", "metal"] },
    "Ford Ranger": { maxWeight: 1200, suitableFor: ["cement", "bricks", "tools", "timber"] },
    "Nissan NP200": { maxWeight: 800, suitableFor: ["tools", "other"] },
    "Mercedes Sprinter": { maxWeight: 2000, suitableFor: ["cement", "bricks", "timber", "metal", "tools"] },
  }

  private readonly URGENCY_MULTIPLIERS = {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private calculateDistanceScore(distance: number, maxDistance = 20): number {
    if (distance > maxDistance) return 0
    return Math.max(0, (maxDistance - distance) / maxDistance)
  }

  private calculateRatingScore(rating: number): number {
    return rating / 5.0 // Normalize to 0-1
  }

  private calculateVehicleMatchScore(driver: Driver, criteria: MatchingCriteria): number {
    const vehicleInfo = this.VEHICLE_CAPACITY_MAP[driver.vehicle_type as keyof typeof this.VEHICLE_CAPACITY_MAP]
    if (!vehicleInfo) return 0.5 // Default score for unknown vehicles

    // Check weight capacity
    const weightScore = criteria.weight <= vehicleInfo.maxWeight ? 1.0 : 0.0

    // Check material suitability
    const materialScore = vehicleInfo.suitableFor.includes(criteria.materialType) ? 1.0 : 0.3

    // Preferred vehicle types
    const preferenceScore = criteria.preferredVehicleTypes?.includes(driver.vehicle_type) ? 1.2 : 1.0

    return Math.min(1.0, weightScore * 0.4 + materialScore * 0.4 + preferenceScore * 0.2)
  }

  private calculateAvailabilityScore(driver: Driver): number {
    if (driver.status !== "available") return 0

    // Consider current job load
    const currentJobs = driver.current_jobs || 0
    const loadScore = Math.max(0, (3 - currentJobs) / 3) // Assume max 3 concurrent jobs

    return loadScore
  }

  private calculateExperienceScore(driver: Driver, criteria: MatchingCriteria): number {
    const experienceYears = driver.experience_years
    const deliveryCount = driver.completed_deliveries

    // Experience with material type
    const hasSpecialization = driver.specializations?.includes(criteria.materialType) ? 1.2 : 1.0

    // Years of experience (capped at 10 years for scoring)
    const yearsScore = Math.min(experienceYears / 10, 1.0)

    // Delivery count (logarithmic scale)
    const deliveryScore = Math.min(Math.log(deliveryCount + 1) / Math.log(500), 1.0)

    return yearsScore * 0.4 + deliveryScore * 0.4 + hasSpecialization * 0.2
  }

  private calculateLoadBalanceScore(driver: Driver): number {
    // Prefer drivers who haven't had recent deliveries for fair distribution
    const lastDelivery = driver.last_delivery_time
    if (!lastDelivery) return 1.0

    const hoursSinceLastDelivery = (Date.now() - lastDelivery.getTime()) / (1000 * 60 * 60)
    return Math.min(hoursSinceLastDelivery / 4, 1.0) // Full score after 4 hours
  }

  private estimateArrivalTime(distance: number, trafficFactor = 1.2): number {
    // Assume average speed of 40 km/h in city traffic
    const baseSpeed = 40
    const adjustedSpeed = baseSpeed / trafficFactor
    return Math.ceil((distance / adjustedSpeed) * 60) // Convert to minutes
  }

  private estimateCost(distance: number, weight: number, urgency: string): number {
    const baseRate = 50 // Base rate in ZAR
    const distanceRate = distance * 8 // R8 per km
    const weightRate = weight * 2 // R2 per kg
    const urgencyMultiplier = this.URGENCY_MULTIPLIERS[urgency as keyof typeof this.URGENCY_MULTIPLIERS]

    return Math.ceil((baseRate + distanceRate + weightRate) * urgencyMultiplier)
  }

  scoreDriver(driver: Driver, criteria: MatchingCriteria): DriverScore | null {
    if (!driver.lat || !driver.lng) return null

    const distance = this.calculateDistance(
      criteria.customerLocation.lat,
      criteria.customerLocation.lng,
      driver.lat,
      driver.lng,
    )

    // Early exit if driver is too far
    if (criteria.maxDistance && distance > criteria.maxDistance) return null

    // Early exit if rating is too low
    if (criteria.minRating && driver.rating < criteria.minRating) return null

    const factors = {
      distance: this.calculateDistanceScore(distance, criteria.maxDistance),
      rating: this.calculateRatingScore(driver.rating),
      vehicleMatch: this.calculateVehicleMatchScore(driver, criteria),
      availability: this.calculateAvailabilityScore(driver),
      experience: this.calculateExperienceScore(driver, criteria),
      loadBalance: this.calculateLoadBalanceScore(driver),
    }

    // Weighted scoring
    const weights = {
      distance: 0.25,
      rating: 0.15,
      vehicleMatch: 0.2,
      availability: 0.2,
      experience: 0.1,
      loadBalance: 0.1,
    }

    const score = Object.entries(factors).reduce((total, [key, value]) => {
      return total + value * weights[key as keyof typeof weights]
    }, 0)

    // Apply urgency multiplier
    const urgencyMultiplier = this.URGENCY_MULTIPLIERS[criteria.urgency]
    const finalScore = Math.min(score * urgencyMultiplier, 1.0)

    return {
      driverId: driver.id,
      score: finalScore,
      factors,
      estimatedArrival: this.estimateArrivalTime(distance),
      estimatedCost: this.estimateCost(distance, criteria.weight, criteria.urgency),
    }
  }

  findBestMatches(drivers: Driver[], criteria: MatchingCriteria, limit = 5): DriverScore[] {
    const scores = drivers
      .map((driver) => this.scoreDriver(driver, criteria))
      .filter((score): score is DriverScore => score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return scores
  }

  autoAssignDriver(drivers: Driver[], criteria: MatchingCriteria): DriverScore | null {
    const matches = this.findBestMatches(drivers, criteria, 1)
    return matches.length > 0 ? matches[0] : null
  }
}

export const driverMatchingEngine = new DriverMatchingEngine()
