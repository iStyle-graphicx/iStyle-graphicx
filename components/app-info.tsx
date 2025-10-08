"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, Building2, Calendar, Globe } from "lucide-react"

export function AppInfo() {
  const appInfo = {
    name: "VanGo Delivery",
    version: "v1.1.0",
    company: "VanGo Delivery (PTY) Ltd.",
    year: "2025",
    description: "Premium Hardware Material Delivery Service",
    location: "South Africa",
    buildDate: new Date().toLocaleDateString(),
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <Info className="w-5 h-5" />
          App Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">Company</p>
                <p className="text-white font-medium">{appInfo.company}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">Copyright</p>
                <p className="text-white font-medium">© {appInfo.year}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">Version</p>
                <p className="text-white font-medium">{appInfo.version}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">Region</p>
                <p className="text-white font-medium">{appInfo.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-gray-400 text-center">{appInfo.description}</p>
          <p className="text-xs text-gray-500 text-center mt-2">Built on {appInfo.buildDate}</p>
        </div>
      </CardContent>
    </Card>
  )
}
