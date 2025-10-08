"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ArrowRight, ArrowLeft } from "lucide-react"

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right"
  highlight?: boolean
}

interface FeatureTourProps {
  isOpen: boolean
  onClose: () => void
  steps: TourStep[]
  onComplete?: () => void
}

export function FeatureTour({ isOpen, onClose, steps, onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target) as HTMLElement
      setTargetElement(element)

      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" })

        // Add highlight class if specified
        if (steps[currentStep].highlight) {
          element.classList.add("tour-highlight")
        }
      }
    }

    return () => {
      // Clean up highlight classes
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        el.classList.remove("tour-highlight")
      })
    }
  }, [isOpen, currentStep, steps])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTour = () => {
    onClose()
  }

  if (!isOpen || !steps[currentStep]) return null

  const step = steps[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Tour Card */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="relative w-full h-full">
          <Card className="absolute bg-white/95 backdrop-blur-md border-orange-500/30 shadow-xl max-w-sm pointer-events-auto tour-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                  {currentStep + 1} of {steps.length}
                </Badge>
                <Button
                  onClick={skipTour}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 bg-transparent"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back
                  </Button>

                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === currentStep
                            ? "bg-orange-500"
                            : index < currentStep
                              ? "bg-orange-500/50"
                              : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <Button onClick={nextStep} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.3), 0 0 0 8px rgba(249, 115, 22, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tour-card {
          animation: tourFadeIn 0.3s ease-out;
        }
        
        @keyframes tourFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
