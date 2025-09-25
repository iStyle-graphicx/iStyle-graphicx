"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, Database } from "lucide-react"

export function PrivacySection() {
  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Privacy Policy</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            VanGo Delivery Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-4">Last updated: January 2025</p>
            <p className="mb-4">
              VanGo Delivery (PTY) Ltd. ("we," "our," or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you use our delivery
              platform.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              1. Information We Collect
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-white">Personal Information:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, phone number</li>
                  <li>Delivery addresses (pickup and drop-off)</li>
                  <li>Payment information (processed securely)</li>
                  <li>Profile photo (optional)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white">Usage Information:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>App usage patterns and preferences</li>
                  <li>Device information and IP address</li>
                  <li>Location data (when permission granted)</li>
                  <li>Communication records with support</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              2. How We Use Your Information
            </h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Facilitate delivery services and driver matching</li>
              <li>Process payments and maintain transaction records</li>
              <li>Provide customer support and resolve issues</li>
              <li>Send service updates and important notifications</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h3>
            <p className="mb-2">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                <strong>Drivers:</strong> Contact and delivery information necessary for service completion
              </li>
              <li>
                <strong>Payment Processors:</strong> Secure payment processing (we don't store full payment details)
              </li>
              <li>
                <strong>Service Providers:</strong> Third-party services that help us operate our platform
              </li>
              <li>
                <strong>Legal Authorities:</strong> When required by law or to protect our rights
              </li>
            </ul>
            <p className="text-sm bg-slate-700/50 rounded-lg p-3">
              <strong>We never sell your personal information to third parties.</strong>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              4. Data Security
            </h3>
            <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
              <li>Secure payment processing through certified providers</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">5. Your Rights and Choices</h3>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Control location sharing permissions</li>
              <li>Request a copy of your data</li>
              <li>Report privacy concerns to our team</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">6. Data Retention</h3>
            <p className="mb-4">
              We retain your information for as long as necessary to provide our services and comply with legal
              obligations. Delivery records are kept for 7 years for tax and legal purposes. You can request account
              deletion at any time.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">7. Children's Privacy</h3>
            <p className="mb-4">
              Our service is not intended for children under 18. We do not knowingly collect personal information from
              children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">8. International Transfers</h3>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than South Africa. We ensure
              appropriate safeguards are in place to protect your information during such transfers.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">9. Changes to This Policy</h3>
            <p className="mb-4">
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or app
              notification. Your continued use of our service constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">10. Contact Us</h3>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Privacy Officer</p>
              <p>VanGo Delivery (PTY) Ltd.</p>
              <p>490 Phase 3, Itsoseng Extension</p>
              <p>Mabopane, 0190, South Africa</p>
              <p>Email: privacy@vango.co.za</p>
              <p>Phone: +27 74 629 7208</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
