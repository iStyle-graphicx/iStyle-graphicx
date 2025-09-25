"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { driverMatchingEngine, type MatchingCriteria, type DriverScore, type Driver } from "@/lib/driver-matching"
import { Zap, Star, MapPin, Clock, Car, CheckCircle, Loader2, User } from "lucide-react"

interface DriverMatchingModalProps {
  isOpen: boolean
  onClose: () => void
  criteria: MatchingCriteria
  drivers: Driver[]
  onDriverSelected: (driverId: string) => void
}

export function DriverMatchingModal({
  isOpen,
  onClose,
  criteria,
  drivers,
  onDriverSelected,
}: DriverMatchingModalProps) {
  const [matches, setMatches] = useState<DriverScore[]>([])
  const [selectedMatch, setSelectedMatch] = useState<DriverScore | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && drivers.length > 0) {
      performMatching()
    }
  }, [isOpen, drivers, criteria])

  const performMatching = async () => {
    setIsMatching(true)

    // Simulate processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const bestMatches = driverMatchingEngine.findBestMatches(drivers, criteria, 5)
    setMatches(bestMatches)

    if (bestMatches.length > 0) {
      setSelectedMatch(bestMatches[0])
    }

    setIsMatching(false)
  }

  const handleAutoAssign = async () => {
    const bestMatch = driverMatchingEngine.autoAssignDriver(drivers, criteria)
    if (bestMatch) {
      onDriverSelected(bestMatch.driverId)
      toast({
        title: "Driver Auto-Assigned",
        description: `Best match found and assigned automatically!`,
      })
      onClose()
    } else {
      toast({
        title: "No Suitable Drivers",
        description: "No drivers match your criteria at the moment.",
        variant: "destructive",
      })
    }
  }

  const handleManualSelect = () => {
    if (selectedMatch) {
      onDriverSelected(selectedMatch.driverId)
      toast({
        title: "Driver Selected",
        description: `Driver assigned successfully!`,
      })
      onClose()
    }
  }

  const getDriver = (driverId: string) => {
    return drivers.find((d) => d.id === driverId)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-500"
    if (score >= 0.6) return "text-yellow-500"
    return "text-orange-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return "Excellent Match"
    if (score >= 0.8) return "Great Match"
    if (score >= 0.6) return "Good Match"
    return "Fair Match"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Smart Driver Matching
          </DialogTitle>
        </DialogHeader>

        {isMatching ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <h3 className="text-xl font-semibold text-white">Finding Perfect Matches</h3>
            <p className="text-gray-400 text-center">
              Analyzing {drivers.length} available drivers based on distance, rating, vehicle compatibility, and
              experience...
            </p>
            <div className="w-full max-w-xs">
              <Progress value={85} className="h-2" />
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
            <p className="text-gray-400 mb-6">
              No drivers currently match your delivery criteria. Try adjusting your requirements or check back later.
            </p>
            <Button onClick={onClose} variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Auto-assign option */}
            <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Auto-Assign Best Match
                    </h3>
                    <p className="text-sm text-gray-300">Let our AI select the optimal driver based on all factors</p>
                  </div>
                  <Button onClick={handleAutoAssign} className="bg-orange-500 hover:bg-orange-600 text-white">
                    Auto-Assign
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Or Choose Manually:</h3>
              <div className="space-y-3">
                {matches.map((match, index) => {
                  const driver = getDriver(match.driverId)
                  if (!driver) return null

                  return (
                    <Card
                      key={match.driverId}
                      className={`cursor-pointer transition-all ${
                        selectedMatch?.driverId === match.driverId
                          ? "ring-2 ring-orange-500 bg-white/20"
                          : "bg-white/10 hover:bg-white/15"
                      } backdrop-blur-md border-white/20`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Driver Avatar */}
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                            {driver.avatar_url ? (
                              <img
                                src={driver.avatar_url || "/placeholder.svg"}
                                alt={driver.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6" />
                            )}
                          </div>

                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{driver.name}</h4>
                                {index === 0 && <Badge className="bg-green-500 text-white text-xs">Best Match</Badge>}
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getScoreColor(match.score)}`}>
                                  {Math.round(match.score * 100)}%
                                </div>
                                <div className="text-xs text-gray-400">{getScoreLabel(match.score)}</div>
                              </div>
                            </div>

                            {/* Driver Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{driver.rating} rating</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Car className="w-4 h-4" />
                                <span>{driver.vehicle_type}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-4 h-4 text-green-500" />
                                <span>{match.estimatedArrival} min ETA</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{driver.distance}</span>
                              </div>
                            </div>

                            {/* Matching Factors */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-white font-medium">
                                  {Math.round(match.factors.distance * 100)}%
                                </div>
                                <div className="text-gray-400">Distance</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-medium">
                                  {Math.round(match.factors.vehicleMatch * 100)}%
                                </div>
                                <div className="text-gray-400">Vehicle</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-medium">
                                  {Math.round(match.factors.experience * 100)}%
                                </div>
                                <div className="text-gray-400">Experience</div>
                              </div>
                            </div>

                            {/* Cost */}
                            <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
                              <span className="text-gray-400">Estimated Cost:</span>
                              <span className="text-orange-500 font-bold">R {match.estimatedCost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualSelect}
                disabled={!selectedMatch}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Select Driver
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
