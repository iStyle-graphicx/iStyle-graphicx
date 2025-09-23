"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Truck,
  Shield,
  Clock,
  MapPin,
  Star,
  Users,
  Package,
  CreditCard,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  Award,
  Target,
  Zap,
  Globe,
  Heart,
  TrendingUp,
} from "lucide-react"

export function LearnMoreSection() {
  const features = [
    {
      icon: <Truck className="w-8 h-8 text-orange-500" />,
      title: "Professional Drivers",
      description: "Vetted and trained drivers with clean records and proper insurance coverage.",
      details: ["Background checks", "Vehicle inspections", "Insurance verified", "Regular training"],
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-500" />,
      title: "Secure & Insured",
      description: "Your deliveries are protected with comprehensive insurance coverage.",
      details: ["Full liability coverage", "Cargo protection", "Secure handling", "Damage compensation"],
    },
    {
      icon: <Clock className="w-8 h-8 text-green-500" />,
      title: "Real-Time Tracking",
      description: "Track your delivery in real-time from pickup to drop-off.",
      details: ["Live GPS tracking", "Status updates", "ETA notifications", "Photo confirmations"],
    },
    {
      icon: <MapPin className="w-8 h-8 text-red-500" />,
      title: "Wide Coverage",
      description: "Serving Pretoria and surrounding areas with expanding coverage.",
      details: ["Pretoria CBD", "Centurion", "Midrand", "Sandton", "Expanding daily"],
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      title: "Quality Service",
      description: "Rated 4.8/5 stars by thousands of satisfied customers.",
      details: ["Customer reviews", "Quality assurance", "Service guarantees", "24/7 support"],
    },
    {
      icon: <CreditCard className="w-8 h-8 text-purple-500" />,
      title: "Flexible Payment",
      description: "Multiple payment options for your convenience.",
      details: ["Credit/Debit cards", "PayPal", "EFT transfers", "Secure processing"],
    },
  ]

  const stats = [
    { icon: <Package className="w-6 h-6" />, value: "50,000+", label: "Deliveries Completed" },
    { icon: <Users className="w-6 h-6" />, value: "10,000+", label: "Happy Customers" },
    { icon: <Truck className="w-6 h-6" />, value: "500+", label: "Active Drivers" },
    { icon: <Award className="w-6 h-6" />, value: "4.8/5", label: "Average Rating" },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: <Target className="w-8 h-8 text-orange-500" />,
      title: "Request Delivery",
      description: "Enter pickup and delivery locations, describe your items, and get an instant quote.",
    },
    {
      step: 2,
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Driver Assignment",
      description: "We match you with the best available driver based on location and vehicle type.",
    },
    {
      step: 3,
      icon: <Zap className="w-8 h-8 text-green-500" />,
      title: "Real-Time Updates",
      description: "Track your delivery in real-time and receive notifications at every step.",
    },
    {
      step: 4,
      icon: <CheckCircle className="w-8 h-8 text-purple-500" />,
      title: "Delivery Complete",
      description: "Receive confirmation with photos and rate your experience.",
    },
  ]

  const pricingTiers = [
    {
      name: "Light Materials",
      price: "R30-45",
      unit: "per km",
      icon: <Package className="w-6 h-6 text-blue-500" />,
      features: ["Up to 50kg", "Small items", "Documents", "Personal items"],
    },
    {
      name: "Medium Materials",
      price: "R40-60",
      unit: "per km",
      icon: <Truck className="w-6 h-6 text-orange-500" />,
      features: ["50-200kg", "Furniture", "Appliances", "Building supplies"],
    },
    {
      name: "Heavy Materials",
      price: "R50-80",
      unit: "per km",
      icon: <Award className="w-6 h-6 text-green-500" />,
      features: ["200kg+", "Construction materials", "Industrial equipment", "Bulk items"],
    },
  ]

  return (
    <div className="px-4 pt-6 pb-16 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Why Choose VanGo?</h2>
        <p className="text-gray-300 text-lg">
          South Africa's most trusted delivery platform for construction materials and more.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2 text-orange-500">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Features */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white text-center mb-6">Our Features</h3>
        {features.map((feature, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.details.map((detail, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-700 text-gray-300">
                        {detail}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white text-center mb-6">How It Works</h3>
        {howItWorks.map((step, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {step.icon}
                    <h4 className="text-xl font-semibold text-white">{step.title}</h4>
                  </div>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white text-center mb-6">Transparent Pricing</h3>
        {pricingTiers.map((tier, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {tier.icon}
                  <div>
                    <h4 className="text-lg font-semibold text-white">{tier.name}</h4>
                    <p className="text-sm text-gray-400">{tier.features[0]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">{tier.price}</div>
                  <div className="text-sm text-gray-400">{tier.unit}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tier.features.map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="border-gray-600 text-gray-300">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Get in Touch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold text-white">Call Us</p>
                <p className="text-sm text-gray-300">+27 11 123 4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold text-white">Email Support</p>
                <p className="text-sm text-gray-300">support@vango.co.za</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-semibold text-white">Live Chat</p>
                <p className="text-sm text-gray-300">Available 24/7</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-white/20">
            <p className="text-gray-300 text-sm mb-4">
              Have questions? We're here to help you get your deliveries done right.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2">Contact Support</Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Mission */}
      <Card className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <Globe className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-3">Our Mission</h3>
          <p className="text-gray-300 mb-4">
            To revolutionize delivery services in South Africa by connecting customers with reliable drivers, making
            construction material delivery fast, affordable, and transparent.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Growing stronger every day</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
