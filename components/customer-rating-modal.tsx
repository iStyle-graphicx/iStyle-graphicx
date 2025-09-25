"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface CustomerRatingModalProps {
  isOpen: boolean
  onClose: () => void
  deliveryId: string
  driverId: string
  driverName: string
  onRatingSubmitted?: () => void
}

export function CustomerRatingModal({
  isOpen,
  onClose,
  deliveryId,
  driverId,
  driverName,
  onRatingSubmitted,
}: CustomerRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const submitRating = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Insert rating
      const { error: ratingError } = await supabase.from("driver_ratings").insert({
        driver_id: driverId,
        delivery_id: deliveryId,
        customer_id: user.id,
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

      toast({
        title: "Rating Submitted",
        description: `Thank you for rating ${driverName}!`,
      })

      // Reset form
      setRating(0)
      setComment("")

      // Call callback if provided
      onRatingSubmitted?.()

      onClose()
    } catch (error) {
      console.error("[v0] Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoveredRating(0)
    setComment("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Rate Your Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-300 mb-4">How was your delivery experience with {driverName}?</p>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm font-medium text-white">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-gray-300">Additional Comments (Optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Skip
            </Button>
            <Button
              onClick={submitRating}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
