"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, Clock, Share2, FileText, Shield, Copyright } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/contexts/settings-context"

interface HelpSupportSectionProps {
  onNavigate?: (section: string) => void
}

export function HelpSupportSection({ onNavigate }: HelpSupportSectionProps) {
  const { toast } = useToast()
  const { shareApp } = useSettings()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create mailto link
    const mailtoLink = `mailto:info@vango.co.za?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage: ${formData.message}`)}`

    window.location.href = mailtoLink

    toast({
      title: "Message sent",
      description: "Your message has been sent to info@vango.co.za",
    })

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
  }

  const contactInfo = [
    { icon: Phone, title: "Phone", value: "+27 74 629 7208", subtitle: "Monday-Friday, 8am-6pm" },
    { icon: Mail, title: "Email", value: "info@vango.co.za", subtitle: "We respond within 24 hours" },
    {
      icon: MapPin,
      title: "Address",
      value: "490 Phase 3, Itsoseng Extension, Mabopane, 0190, South Africa",
      subtitle: "",
    },
    {
      icon: Clock,
      title: "Business Hours",
      value: "Monday-Friday: 8am-6pm\nSaturday: 9am-3pm\nSunday: Closed",
      subtitle: "",
    },
  ]

  const supportAreas = [
    {
      title: "Customer Support",
      description: "Need help with your account or delivery issues?",
      email: "support@vango.co.za",
    },
    {
      title: "Driver Support",
      description: "Questions about driving with VanGo or payment issues?",
      email: "drivers@vango.co.za",
    },
    {
      title: "Business Inquiries",
      description: "Interested in our business solutions or partnerships?",
      email: "business@vango.co.za",
    },
  ]

  const legalDocuments = [
    {
      id: "termsSection",
      title: "Terms of Service",
      description: "Read our terms and conditions for using VanGo services",
      icon: FileText,
    },
    {
      id: "privacySection",
      title: "Privacy Policy",
      description: "Learn how we protect and handle your personal information",
      icon: Shield,
    },
    {
      id: "copyrightSection",
      title: "Copyright Policy",
      description: "VanGo app intellectual property and usage rights",
      icon: Copyright,
    },
  ]

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Help & Support</h2>

      {/* Share App Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share VanGo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Love using VanGo? Share our app with friends and family to help them discover reliable delivery services.
          </p>
          <Button onClick={shareApp} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <Share2 className="w-4 h-4 mr-2" />
            Share VanGo App
          </Button>
        </CardContent>
      </Card>

      {/* Legal Documents Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Legal Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Important legal information about using VanGo services and your rights as a user.
          </p>
          <div className="space-y-3">
            {legalDocuments.map((doc) => {
              const Icon = doc.icon
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors"
                  onClick={() => onNavigate?.(doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{doc.title}</h4>
                      <p className="text-sm text-gray-400">{doc.description}</p>
                    </div>
                  </div>
                  <div className="text-orange-500">→</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Us Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Have questions about our services or need assistance? Our team is here to help.
          </p>

          <div className="space-y-4">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{info.title}</h4>
                    <p className="text-gray-300 whitespace-pre-line">{info.value}</p>
                    {info.subtitle && <p className="text-sm text-gray-400">{info.subtitle}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Send Us a Message Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Send Us a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Your email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Your phone number"
              />
            </div>

            <div>
              <Label htmlFor="subject" className="text-white">
                Subject
              </Label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Subject of your message"
                required
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-white">
                How can we help you?
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                rows={4}
                placeholder="Let us know how we can assist you..."
                required
              />
            </div>

            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white w-full py-2">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Support Areas Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Support Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">We're Here to Help. Get support for different parts of our service.</p>

          <div className="space-y-4">
            {supportAreas.map((area, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-white">{area.title}</h4>
                <p className="text-gray-300 text-sm mb-2">{area.description}</p>
                <p className="text-orange-500">{area.email}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
