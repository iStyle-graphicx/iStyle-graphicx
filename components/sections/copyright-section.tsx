"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copyright, FileText, AlertCircle } from "lucide-react"

export function CopyrightSection() {
  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Copyright Policy</h2>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Copyright className="w-5 h-5" />
            VanGo App Copyright & Intellectual Property Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-4">Last updated: January 2025</p>
            <p className="mb-4">
              This Copyright Policy outlines the intellectual property rights and usage terms for the VanGo Delivery
              application and related services provided by VanGo Delivery (PTY) Ltd.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              1. Ownership and Copyright
            </h3>
            <div className="space-y-3">
              <p>
                The VanGo Delivery application, including but not limited to its design, code, graphics, logos, text,
                and functionality, is the exclusive property of VanGo Delivery (PTY) Ltd. and is protected by South
                African and international copyright laws.
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="font-semibold text-white">© 2025 VanGo Delivery (PTY) Ltd. All rights reserved.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">2. Trademark Protection</h3>
            <p className="mb-4">
              "VanGo," the VanGo logo, and related marks are trademarks of VanGo Delivery (PTY) Ltd. These trademarks
              may not be used without our express written permission.
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>VanGo® - Registered trademark</li>
              <li>VanGo Delivery® - Service mark</li>
              <li>VanGo logo and design elements</li>
              <li>Associated branding and marketing materials</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">3. Permitted Use</h3>
            <p className="mb-2">Users are granted a limited, non-exclusive license to:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Use the VanGo app for personal or business delivery services</li>
              <li>Share screenshots for support or promotional purposes</li>
              <li>Reference VanGo in reviews or testimonials</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              4. Prohibited Activities
            </h3>
            <p className="mb-2">The following activities are strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Copying, cloning, or reverse engineering the VanGo app</li>
              <li>Creating derivative works or competing applications</li>
              <li>Using VanGo trademarks without permission</li>
              <li>Distributing or selling copies of the application</li>
              <li>Removing or altering copyright notices</li>
              <li>Using our intellectual property for commercial purposes without authorization</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">5. User-Generated Content</h3>
            <p className="mb-4">
              By submitting content to VanGo (reviews, photos, feedback), you grant us a non-exclusive, royalty-free
              license to use, modify, and display such content for service improvement and promotional purposes.
            </p>
            <p className="text-sm bg-slate-700/50 rounded-lg p-3">
              You retain ownership of your original content but grant us usage rights as described above.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">6. Third-Party Content</h3>
            <p className="mb-4">
              The VanGo app may include third-party content, libraries, or services. Such content remains the property
              of their respective owners and is used under appropriate licenses.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">7. DMCA Compliance</h3>
            <p className="mb-4">
              We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA). If
              you believe your copyrighted work has been infringed, please contact our designated agent.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">8. Enforcement</h3>
            <p className="mb-4">
              VanGo Delivery (PTY) Ltd. actively protects its intellectual property rights. Violations may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Account termination</li>
              <li>Legal action for damages</li>
              <li>Injunctive relief</li>
              <li>Recovery of attorney fees and costs</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">9. Licensing Inquiries</h3>
            <p className="mb-4">
              For licensing opportunities, partnerships, or permission to use VanGo intellectual property, please
              contact our business development team.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">10. Contact Information</h3>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Intellectual Property Department</p>
              <p>VanGo Delivery (PTY) Ltd.</p>
              <p>490 Phase 3, Itsoseng Extension</p>
              <p>Mabopane, 0190, South Africa</p>
              <p>Email: legal@vango.co.za</p>
              <p>Phone: +27 74 629 7208</p>
              <p className="mt-2 text-sm text-gray-400">For copyright infringement claims: dmca@vango.co.za</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-gray-400 text-center">
              This policy is governed by the laws of South Africa. Any disputes will be resolved in the courts of South
              Africa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
