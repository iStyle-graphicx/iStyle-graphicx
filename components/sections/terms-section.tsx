"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText } from "lucide-react"

export function TermsSection() {
  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Terms of Service</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            VanGo Delivery Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-4">Last updated: January 2025</p>
            <p className="mb-4">
              Welcome to VanGo Delivery. These Terms of Service ("Terms") govern your use of our delivery platform and
              services provided by VanGo Delivery (PTY) Ltd.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing or using VanGo Delivery services, you agree to be bound by these Terms. If you disagree with
              any part of these terms, you may not access our service.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">2. Service Description</h3>
            <p className="mb-4">
              VanGo Delivery provides a platform connecting customers with independent drivers for hardware material
              transportation services throughout South Africa, primarily in the Pretoria area.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">3. User Responsibilities</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Provide accurate delivery information</li>
              <li>Ensure items comply with our prohibited items policy</li>
              <li>Be available for pickup and delivery coordination</li>
              <li>Pay for services as agreed</li>
              <li>Treat drivers with respect and professionalism</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">4. Driver Terms</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Must have valid driver's license and vehicle registration</li>
              <li>Maintain appropriate insurance coverage</li>
              <li>Handle items with care and professionalism</li>
              <li>Follow all traffic laws and safety regulations</li>
              <li>Complete deliveries in a timely manner</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">5. Prohibited Items</h3>
            <p className="mb-2">The following items are prohibited from transport:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Hazardous materials and chemicals</li>
              <li>Illegal substances or contraband</li>
              <li>Live animals</li>
              <li>Perishable food items</li>
              <li>Items exceeding weight or size limits</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">6. Pricing and Payment</h3>
            <p className="mb-4">
              Delivery prices are calculated based on distance, item size, weight, and current demand. Payment is
              processed through our secure platform. Cancellation fees may apply for last-minute cancellations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">7. Liability and Insurance</h3>
            <p className="mb-4">
              While we strive to provide reliable service, VanGo Delivery's liability is limited to the declared value
              of items. Users are encouraged to obtain appropriate insurance for valuable items.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">8. Privacy and Data</h3>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and
              protect your personal information.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">9. Modifications</h3>
            <p className="mb-4">
              VanGo Delivery reserves the right to modify these Terms at any time. Users will be notified of significant
              changes via email or app notification.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">10. Contact Information</h3>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">VanGo Delivery (PTY) Ltd.</p>
              <p>490 Phase 3, Itsoseng Extension</p>
              <p>Mabopane, 0190, South Africa</p>
              <p>Email: legal@vango.co.za</p>
              <p>Phone: +27 74 629 7208</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
