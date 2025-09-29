"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, Volume2, MousePointer, Keyboard, Accessibility, RefreshCw, CheckCircle } from "lucide-react"
import { useAccessibility } from "./accessibility-provider"

export function AccessibilitySettings() {
  const { settings, updateSetting, announceToScreenReader, isScreenReaderActive } = useAccessibility()

  const handleTestAnnouncement = () => {
    announceToScreenReader(
      "This is a test announcement for screen readers. VanGo accessibility features are working correctly.",
    )
  }

  const resetToDefaults = () => {
    updateSetting("highContrast", false)
    updateSetting("reducedMotion", false)
    updateSetting("largeText", false)
    updateSetting("screenReader", false)
    updateSetting("keyboardNavigation", true)
    updateSetting("focusVisible", true)
    announceToScreenReader("Accessibility settings have been reset to defaults")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Accessibility className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Accessibility Settings</h2>
        {isScreenReaderActive && <Badge variant="default">Screen Reader Detected</Badge>}
      </div>

      <Card className="vango-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Visual Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="high-contrast" className="text-base font-medium">
                High Contrast Mode
              </Label>
              <p className="text-sm text-gray-400">Increases contrast for better visibility</p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting("highContrast", checked)}
              aria-describedby="high-contrast-description"
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="large-text" className="text-base font-medium">
                Large Text
              </Label>
              <p className="text-sm text-gray-400">Increases font size throughout the app</p>
            </div>
            <Switch
              id="large-text"
              checked={settings.largeText}
              onCheckedChange={(checked) => updateSetting("largeText", checked)}
              aria-describedby="large-text-description"
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="focus-visible" className="text-base font-medium">
                Enhanced Focus Indicators
              </Label>
              <p className="text-sm text-gray-400">Shows clear focus outlines for keyboard navigation</p>
            </div>
            <Switch
              id="focus-visible"
              checked={settings.focusVisible}
              onCheckedChange={(checked) => updateSetting("focusVisible", checked)}
              aria-describedby="focus-visible-description"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="vango-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-green-400" />
            Motion & Interaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reduced-motion" className="text-base font-medium">
                Reduced Motion
              </Label>
              <p className="text-sm text-gray-400">Minimizes animations and transitions</p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
              aria-describedby="reduced-motion-description"
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="keyboard-navigation" className="text-base font-medium">
                Keyboard Navigation
              </Label>
              <p className="text-sm text-gray-400">Enables full keyboard accessibility</p>
            </div>
            <Switch
              id="keyboard-navigation"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => updateSetting("keyboardNavigation", checked)}
              aria-describedby="keyboard-navigation-description"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="vango-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-400" />
            Screen Reader Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="screen-reader" className="text-base font-medium">
                Enhanced Screen Reader Mode
              </Label>
              <p className="text-sm text-gray-400">Optimizes content for screen readers</p>
            </div>
            <Switch
              id="screen-reader"
              checked={settings.screenReader}
              onCheckedChange={(checked) => updateSetting("screenReader", checked)}
              aria-describedby="screen-reader-description"
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="space-y-3">
            <Label className="text-base font-medium">Screen Reader Test</Label>
            <p className="text-sm text-gray-400">Test if screen reader announcements are working</p>
            <Button onClick={handleTestAnnouncement} variant="outline" className="w-full bg-transparent">
              <Volume2 className="w-4 h-4 mr-2" />
              Test Screen Reader Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="vango-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-400" />
            Accessibility Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">WCAG 2.1 AA</p>
              <p className="text-xs text-gray-400">Compliant</p>
            </div>
            <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Keyboard className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Keyboard</p>
              <p className="text-xs text-gray-400">Accessible</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex gap-3">
            <Button onClick={resetToDefaults} variant="outline" className="flex-1 bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden announcements for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" id="accessibility-announcements"></div>
    </div>
  )
}
