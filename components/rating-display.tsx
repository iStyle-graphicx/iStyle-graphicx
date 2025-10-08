"use client"

import { Star } from "lucide-react"

interface RatingDisplayProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function RatingDisplay({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className = "",
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : i < rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-gray-300"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-300 ml-1`}>{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
