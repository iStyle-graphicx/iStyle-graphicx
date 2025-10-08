"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RatingDisplay } from "@/components/rating-display"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  customer: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
}

interface ReviewsListProps {
  driverId: string
  limit?: number
}

export function ReviewsList({ driverId, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [driverId])

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from("driver_ratings")
        .select(`
          id,
          rating,
          comment,
          created_at,
          customer:profiles!customer_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      setReviews(data || [])
    } catch (error) {
      console.error("[v0] Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No reviews yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.customer.avatar_url || undefined} />
                <AvatarFallback className="bg-orange-500 text-white">
                  {review.customer.first_name?.[0]}
                  {review.customer.last_name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">
                      {review.customer.first_name} {review.customer.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <RatingDisplay rating={review.rating} size="sm" />
                </div>

                {review.comment && <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
