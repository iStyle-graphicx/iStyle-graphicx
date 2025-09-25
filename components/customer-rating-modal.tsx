"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CustomerRatingModalProps {
  isOpen: boolean
  onClose: () => void
  deliveryId: string
  driverId: string
  driverName: string
}

export function CustomerRatingModal({ isOpen, onClose, deliveryId, driverId, driverName }: CustomerRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const submitRating = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    try {
      // Insert rating
      const { error: ratingError } = await supabase.from("driver_ratings").insert({
        driver_id: driverId,
        delivery_id: deliveryId,
        rating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString(),
      })

      if (ratingError) throw ratingError

      // Update delivery status
      await supabase.from("deliveries").update({ status: "rated" }).eq("id", deliveryId)

      // Calculate new average rating for driver
      const { data: ratings } = await supabase.from("driver_ratings").select("rating").eq("driver_id", driverId)

      if (ratings && ratings.length > 0) {
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

        await supabase.from("drivers").update({ rating: averageRating }).eq("id", driverId)
      }

      // Send notification to driver
      await supabase.from("notifications").insert({
        user_id: driverId,
        title: "New Rating Received",
        message: `You received a ${rating}-star rating${comment ? " with feedback" : ""}`,
        type: "system",
        is_read: false,
      })

      onClose()
    } catch (error) {
      console.error("[v0] Error submitting rating:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">How was your delivery experience with {driverName}?</p>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm font-medium">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Comments (Optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Skip
            </Button>
            <Button onClick={submitRating} disabled={rating === 0 || isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
