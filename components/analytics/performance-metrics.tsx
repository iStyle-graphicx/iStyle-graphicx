"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, CheckCircle, TrendingUp } from "lucide-react"

interface PerformanceMetricsProps {
  rating: number
  totalRatings: number
  onTimeRate: number
  completionRate: number
  acceptanceRate: number
  averageDeliveryTime: number
}

export function PerformanceMetrics({
  rating,
  totalRatings,
  onTimeRate,
  completionRate,
  acceptanceRate,
  averageDeliveryTime,
}: PerformanceMetricsProps) {
  const getPerformanceColor = (value: number) => {
    if (value >= 90) return "text-green-400"
    if (value >= 75) return "text-yellow-400"
    return "text-red-400"
  }

  const getPerformanceBadge = (value: number) => {
    if (value >= 90) return { text: "Excellent", color: "bg-green-500/20 text-green-400 border-green-500/30" }
    if (value >= 75) return { text: "Good", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    return { text: "Needs Improvement", color: "bg-red-500/20 text-red-400 border-red-500/30" }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-300">Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">/ 5.0</span>
            </div>
          </div>
          <Progress value={(rating / 5) * 100} className="h-2" />
          <p className="text-xs text-gray-400">{totalRatings} total ratings</p>
        </div>

        {/* On-Time Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-300">On-Time Delivery Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getPerformanceColor(onTimeRate)}`}>{onTimeRate}%</span>
              <Badge className={getPerformanceBadge(onTimeRate).color}>{getPerformanceBadge(onTimeRate).text}</Badge>
            </div>
          </div>
          <Progress value={onTimeRate} className="h-2" />
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-300">Completion Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getPerformanceColor(completionRate)}`}>{completionRate}%</span>
              <Badge className={getPerformanceBadge(completionRate).color}>
                {getPerformanceBadge(completionRate).text}
              </Badge>
            </div>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Acceptance Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-300">Acceptance Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getPerformanceColor(acceptanceRate)}`}>{acceptanceRate}%</span>
              <Badge className={getPerformanceBadge(acceptanceRate).color}>
                {getPerformanceBadge(acceptanceRate).text}
              </Badge>
            </div>
          </div>
          <Progress value={acceptanceRate} className="h-2" />
        </div>

        {/* Average Delivery Time */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Average Delivery Time</span>
            <span className="text-lg font-bold text-white">{averageDeliveryTime} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
