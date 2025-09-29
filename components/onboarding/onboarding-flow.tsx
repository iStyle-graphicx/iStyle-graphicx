"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VangoLogo } from "@/components/vango-logo"
import { Package, Truck, MapPin, Star, CheckCircle, ArrowRight, ArrowLeft, Shield, Clock, Users } from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
  userType?: "customer" | "driver" | null
}

export function OnboardingFlow({ onComplete, userType }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    {
      id: "welcome",
      title: "Welcome to VanGo",
      subtitle: "Premium Hardware Material Delivery",
      content: (
        <div className="text-center space-y-6">
          <div className="animate-vango-pulse">
            <VangoLogo size="xl" variant="full" className="justify-center" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">Welcome to VanGo!</h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              South Africa's premier platform for hardware material delivery. Connect with reliable drivers and get your
              materials delivered safely and on time.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <Shield className="text-orange-500 w-8 h-8 mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Trusted & Secure</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <Clock className="text-orange-500 w-8 h-8 mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Fast Delivery</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "how-it-works",
      title: "How VanGo Works",
      subtitle: "Simple 3-step process",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                1
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-lg">Request a Delivery</h3>
                <p className="text-gray-300">
                  Enter your pickup and delivery locations, describe your materials, and get an instant quote.
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <Package className="w-4 h-4" />
                  <span>All hardware materials supported</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                2
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-lg">Get Matched with a Driver</h3>
                <p className="text-gray-300">
                  Our smart system finds the best available driver near you with the right vehicle for your materials.
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <Truck className="w-4 h-4" />
                  <span>Verified professional drivers</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                3
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-lg">Track in Real-Time</h3>
                <p className="text-gray-300">
                  Monitor your delivery from pickup to destination with live GPS tracking and receive updates every step
                  of the way.
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <MapPin className="w-4 h-4" />
                  <span>Live GPS tracking included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "services",
      title: "Our Services",
      subtitle: "What we deliver",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">What We Deliver</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="text-orange-500 w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-white">Construction Materials</h3>
                    <p className="text-sm text-gray-300">Cement, bricks, sand, gravel, steel</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="text-orange-500 w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-white">Tools & Equipment</h3>
                    <p className="text-sm text-gray-300">Power tools, machinery, hardware supplies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="text-orange-500 w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-white">Bulk Deliveries</h3>
                    <p className="text-sm text-gray-300">Large quantities, multiple locations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="text-orange-500 w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-white">Emergency Deliveries</h3>
                    <p className="text-sm text-gray-300">Urgent materials, same-day delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "features",
      title: "Key Features",
      subtitle: "Why choose VanGo",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Why Choose VanGo?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
              <CheckCircle className="text-green-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Verified Drivers</h3>
                <p className="text-sm text-gray-300">All drivers are background-checked and vehicle-verified</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
              <CheckCircle className="text-green-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Real-time Tracking</h3>
                <p className="text-sm text-gray-300">Track your delivery live with GPS and get instant updates</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
              <CheckCircle className="text-green-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Instant Quotes</h3>
                <p className="text-sm text-gray-300">Get transparent pricing upfront with no hidden fees</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
              <CheckCircle className="text-green-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">24/7 Support</h3>
                <p className="text-sm text-gray-300">Customer support available around the clock</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
              <CheckCircle className="text-green-500 w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Secure Payments</h3>
                <p className="text-sm text-gray-300">Safe and secure payment processing with multiple options</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "get-started",
      title: "Ready to Get Started?",
      subtitle: "Join thousands of satisfied customers",
      content: (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">You're All Set!</h2>
            <p className="text-gray-300 text-lg">
              Ready to experience premium hardware material delivery? Let's get your first delivery started.
            </p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Users className="text-orange-500 w-6 h-6" />
                <span className="text-white font-semibold">Join 10,000+ Happy Customers</span>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">4.8</div>
                  <div className="flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">Average Rating</div>
                </div>

                <div className="w-px h-12 bg-gray-600"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">50k+</div>
                  <div className="text-xs text-gray-400">Deliveries Completed</div>
                </div>

                <div className="w-px h-12 bg-gray-600"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">98%</div>
                  <div className="text-xs text-gray-400">On-Time Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100)
  }, [currentStep, steps.length])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button onClick={skipOnboarding} className="text-sm text-gray-400 hover:text-white transition-colors">
              Skip Tour
            </button>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 min-h-[500px]">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="text-center">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {steps[currentStep].subtitle}
                </Badge>
              </div>

              {/* Step Content */}
              <div className="min-h-[350px] flex flex-col justify-center">{steps[currentStep].content}</div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="flex gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? "bg-orange-500"
                          : index < currentStep
                            ? "bg-orange-500/50"
                            : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>

                <Button onClick={nextStep} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
