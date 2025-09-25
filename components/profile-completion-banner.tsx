"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, User, Phone, Mail } from "lucide-react"

interface ProfileCompletionBannerProps {
  user: any
  profile: any
  onEditProfile: () => void
  onAddPayment: () => void
}

export function ProfileCompletionBanner({ user, profile, onEditProfile, onAddPayment }: ProfileCompletionBannerProps) {
  const [completionData, setCompletionData] = useState({
    percentage: 0,
    missingFields: [] as string[],
    completedFields: [] as string[],
  })

  useEffect(() => {
    calculateCompletion()
  }, [user, profile])

  const calculateCompletion = () => {
    const fields = [
      { key: "email", label: "Email", value: user?.email, icon: Mail },
      { key: "first_name", label: "First Name", value: profile?.first_name, icon: User },
      { key: "last_name", label: "Last Name", value: profile?.last_name, icon: User },
      { key: "phone", label: "Phone Number", value: profile?.phone, icon: Phone },
      { key: "avatar", label: "Profile Photo", value: profile?.avatar_url, icon: User },
    ]

    const completed = fields.filter((field) => field.value && field.value.trim() !== "")
    const missing = fields.filter((field) => !field.value || field.value.trim() === "")

    setCompletionData({
      percentage: Math.round((completed.length / fields.length) * 100),
      completedFields: completed.map((f) => f.label),
      missingFields: missing.map((f) => f.label),
    })
  }

  if (completionData.percentage === 100) {
    return null // Don't show banner if profile is complete
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30 backdrop-blur-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-white text-sm">Complete Your Profile</h3>
              <p className="text-gray-300 text-xs">
                Complete your profile to get the best delivery experience and build trust with drivers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Profile Completion</span>
                <span className="text-xs font-medium text-white">{completionData.percentage}%</span>
              </div>
              <Progress value={completionData.percentage} className="h-2 bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionData.percentage}%` }}
                />
              </Progress>
            </div>

            {completionData.missingFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Missing information:</p>
                <div className="flex flex-wrap gap-1">
                  {completionData.missingFields.map((field) => (
                    <span
                      key={field}
                      className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full border border-orange-500/30"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={onEditProfile}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 h-7"
              >
                Complete Profile
              </Button>
              {!profile?.payment_methods?.length && (
                <Button
                  onClick={onAddPayment}
                  size="sm"
                  variant="outline"
                  className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 text-xs px-3 py-1 h-7 bg-transparent"
                >
                  Add Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
