"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RatingDisplay } from "@/components/rating-display"
import { createClient } from "@/lib/supabase/client"
import { Star, TrendingUp } from "lucide-react"

interface RatingSummaryProps {
  driverId: string
}

interface RatingStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: { [key: number]: number }
  recentTrend: "up" | "down" | "stable"
}

export function DriverRatingSummary({ driverId }: RatingSummaryProps) {
  const [stats, setStats] = useState<RatingStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: "stable",
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRatingStats()
  }, [driverId])

  const fetchRatingStats = async () => {
    try {
      const { data: ratings, error } = await supabase
        .from("driver_ratings")
        .select("rating, created_at")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!ratings || ratings.length === 0) {
        setLoading(false)
        return
      }

      // Calculate average rating
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

      // Calculate rating distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratings.forEach((r) => {
        distribution[r.rating as keyof typeof distribution]++
      })

      // Calculate recent trend (last 10 vs previous 10)
      let recentTrend: "up" | "down" | "stable" = "stable"
      if (ratings.length >= 10) {
        const recent10 = ratings.slice(0, 10)
        const previous10 = ratings.slice(10, 20)

        if (previous10.length > 0) {
          const recentAvg = recent10.reduce((sum, r) => sum + r.rating, 0) / recent10.length
          const previousAvg = previous10.reduce((sum, r) => sum + r.rating, 0) / previous10.length

          if (recentAvg > previousAvg + 0.1) recentTrend = "up"
          else if (recentAvg < previousAvg - 0.1) recentTrend = "down"
        }
      }

      setStats({
        averageRating,
        totalReviews: ratings.length,
        ratingDistribution: distribution,
        recentTrend,
      })
    } catch (error) {
      console.error("[v0] Error fetching rating stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-32 mb-4"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-slate-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-slate-700 rounded"></div>
                  <div className="h-2 bg-slate-700 rounded flex-1"></div>
                  <div className="h-3 w-6 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.totalReviews === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Rating Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">No ratings yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Rating Summary
          {stats.recentTrend === "up" && <TrendingUp className="w-4 h-4 text-green-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{stats.averageRating.toFixed(1)}</div>
            <RatingDisplay rating={stats.averageRating} size="sm" />
          </div>
          <div className="text-gray-400">
            <p className="text-sm">Based on {stats.totalReviews} reviews</p>
            {stats.recentTrend === "up" && <p className="text-xs text-green-400">↗ Trending up</p>}
            {stats.recentTrend === "down" && <p className="text-xs text-red-400">↘ Trending down</p>}
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating]
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-gray-300">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
