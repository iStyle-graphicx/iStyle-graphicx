"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, ArrowRight } from "lucide-react"

interface UserTypeSelectorProps {
  onSelect: (userType: "customer" | "driver") => void
  onSkip: () => void
}

export function UserTypeSelector({ onSelect, onSkip }: UserTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<"customer" | "driver" | null>(null)

  const userTypes = [
    {
      type: "customer" as const,
      title: "I need deliveries",
      subtitle: "Customer",
      description: "I want to send hardware materials and need reliable drivers for delivery.",
      icon: Package,
      features: [
        "Request deliveries instantly",
        "Track orders in real-time",
        "Rate and review drivers",
        "Manage delivery history",
      ],
      color: "bg-blue-500",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
    },
    {
      type: "driver" as const,
      title: "I want to deliver",
      subtitle: "Driver",
      description: "I have a vehicle and want to earn money by delivering materials for customers.",
      icon: Truck,
      features: [
        "Earn money on your schedule",
        "Get matched with nearby orders",
        "Build your driver rating",
        "Access driver dashboard",
      ],
      color: "bg-green-500",
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
    },
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Welcome to VanGo!</h1>
          <p className="text-gray-300">How do you plan to use VanGo?</p>
        </div>

        <div className="space-y-4">
          {userTypes.map((userType) => {
            const Icon = userType.icon
            const isSelected = selectedType === userType.type

            return (
              <Card
                key={userType.type}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? `bg-white/15 backdrop-blur-md ${userType.borderColor} border-2`
                    : "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15"
                }`}
                onClick={() => setSelectedType(userType.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${userType.bgColor}`}>
                      <Icon className={`w-6 h-6 ${userType.color.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{userType.title}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={`${userType.bgColor} ${userType.color.replace("bg-", "text-")} border-none`}
                      >
                        {userType.subtitle}
                      </Badge>
                    </div>
                    {isSelected && (
                      <div className={`w-6 h-6 rounded-full ${userType.color} flex items-center justify-center`}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-300 text-sm mb-3">{userType.description}</p>
                  <ul className="space-y-1">
                    {userType.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-400 flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => selectedType && onSelect(selectedType)}
            disabled={!selectedType}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            Continue as {selectedType ? userTypes.find((t) => t.type === selectedType)?.subtitle : "User"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            Skip for now
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">You can change this later in your profile settings</p>
        </div>
      </div>
    </div>
  )
}
