"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DriverProfileSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [vehicleType, setVehicleType] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [driversLicense, setDriversLicense] = useState("")
  const [accountNumber, setAccountNumber] = useState("")

  // Document uploads
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null)
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null)
  const [vehicleDoc, setVehicleDoc] = useState<File | null>(null)
  const [vehicleDocUrl, setVehicleDocUrl] = useState<string | null>(null)
  const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null)
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string | null>(null)

  const handleFileUpload = async (file: File, type: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLicenseDoc(file)
      try {
        const url = await handleFileUpload(file, "license")
        setLicenseDocUrl(url)
      } catch (error) {
        setError("Failed to upload driver's license")
      }
    }
  }

  const handleVehicleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVehicleDoc(file)
      try {
        const url = await handleFileUpload(file, "vehicle")
        setVehicleDocUrl(url)
      } catch (error) {
        setError("Failed to upload vehicle registration")
      }
    }
  }

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInsuranceDoc(file)
      try {
        const url = await handleFileUpload(file, "insurance")
        setInsuranceDocUrl(url)
      } catch (error) {
        setError("Failed to upload insurance document")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!licenseDocUrl || !vehicleDocUrl || !insuranceDocUrl) {
        throw new Error("Please upload all required documents")
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Update driver record
      const { error: driverError } = await supabase
        .from("drivers")
        .update({
          vehicle_type: vehicleType,
          license_plate: licensePlate,
          drivers_license: driversLicense,
          account_number: accountNumber,
          status: "pending_verification",
        })
        .eq("id", user.id)

      if (driverError) throw driverError

      // Store document URLs in a separate table or JSONB field
      // For now, we'll create a simple documents table via API
      await fetch("/api/driver/submit-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          documents: {
            license: licenseDocUrl,
            vehicle: vehicleDocUrl,
            insurance: insuranceDocUrl,
          },
        }),
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/driver/dashboard")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Failed to submit profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle>Profile Submitted!</CardTitle>
            <CardDescription>
              Your profile has been submitted for verification. We'll review your documents and notify you once
              approved.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Driver Profile</h1>
          <p className="text-muted-foreground">
            Please provide all required information and documents to start driving with VANGO
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Tell us about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="licensePlate">License Plate Number</Label>
                <Input
                  id="licensePlate"
                  type="text"
                  placeholder="ABC-1234"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
              <CardDescription>Your personal driver details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="driversLicense">Driver's License Number</Label>
                <Input
                  id="driversLicense"
                  type="text"
                  placeholder="DL123456789"
                  value={driversLicense}
                  onChange={(e) => setDriversLicense(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Bank Account Number (for payments)</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>Upload clear photos or scans of your documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="licenseDoc">Driver's License (Photo)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="licenseDoc"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleLicenseUpload}
                    required
                    className="flex-1"
                  />
                  {licenseDocUrl && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                {licenseDoc && (
                  <p className="text-xs text-muted-foreground">
                    {licenseDoc.name} ({(licenseDoc.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vehicleDoc">Vehicle Registration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="vehicleDoc"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleVehicleUpload}
                    required
                    className="flex-1"
                  />
                  {vehicleDocUrl && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                {vehicleDoc && (
                  <p className="text-xs text-muted-foreground">
                    {vehicleDoc.name} ({(vehicleDoc.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="insuranceDoc">Insurance Certificate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="insuranceDoc"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleInsuranceUpload}
                    required
                    className="flex-1"
                  />
                  {insuranceDocUrl && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                {insuranceDoc && (
                  <p className="text-xs text-muted-foreground">
                    {insuranceDoc.name} ({(insuranceDoc.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit for Verification"}
          </Button>
        </form>
      </div>
    </div>
  )
}
