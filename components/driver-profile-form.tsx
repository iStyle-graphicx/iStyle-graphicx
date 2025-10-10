"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { User, Car, Shield, CreditCard, Phone, Save, ArrowLeft, ArrowRight } from "lucide-react"
import { DriverDocumentUpload } from "@/components/driver-document-upload"

interface DriverProfileFormProps {
  userId: string
  onComplete?: () => void
  onCancel?: () => void
}

export function DriverProfileForm({ userId, onComplete, onCancel }: DriverProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: "",
    last_name: "",
    phone: "",
    email: "",

    // Vehicle Information
    vehicle_type: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_color: "",
    vehicle_capacity: "",
    license_plate: "",

    // License & Insurance
    drivers_license: "",
    license_expiry_date: "",
    pdp_number: "",
    pdp_expiry_date: "",
    insurance_provider: "",
    insurance_policy_number: "",
    insurance_expiry_date: "",

    // Banking Information
    bank_name: "",
    bank_account_holder: "",
    account_number: "",
    bank_branch_code: "",

    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadExistingData()
  }, [userId])

  const loadExistingData = async () => {
    try {
      // Load profile data
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single()

      // Load driver data
      const { data: driverData } = await supabase.from("drivers").select("*").eq("id", userId).single()

      // Get user email
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (profileData || driverData || user) {
        setFormData({
          first_name: profileData?.first_name || "",
          last_name: profileData?.last_name || "",
          phone: profileData?.phone || "",
          email: user?.email || "",
          vehicle_type: driverData?.vehicle_type || "",
          vehicle_make: driverData?.vehicle_make || "",
          vehicle_model: driverData?.vehicle_model || "",
          vehicle_year: driverData?.vehicle_year || "",
          vehicle_color: driverData?.vehicle_color || "",
          vehicle_capacity: driverData?.vehicle_capacity || "",
          license_plate: driverData?.license_plate || "",
          drivers_license: driverData?.drivers_license || "",
          license_expiry_date: driverData?.license_expiry_date || "",
          pdp_number: driverData?.pdp_number || "",
          pdp_expiry_date: driverData?.pdp_expiry_date || "",
          insurance_provider: driverData?.insurance_provider || "",
          insurance_policy_number: driverData?.insurance_policy_number || "",
          insurance_expiry_date: driverData?.insurance_expiry_date || "",
          bank_name: driverData?.bank_name || "",
          bank_account_holder: driverData?.bank_account_holder || "",
          account_number: driverData?.account_number || "",
          bank_branch_code: driverData?.bank_branch_code || "",
          emergency_contact_name: driverData?.emergency_contact_name || "",
          emergency_contact_phone: driverData?.emergency_contact_phone || "",
          emergency_contact_relationship: driverData?.emergency_contact_relationship || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading driver data:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        if (!formData.first_name || !formData.last_name || !formData.phone) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required personal information fields",
            variant: "destructive",
          })
          return false
        }
        break
      case 2: // Vehicle Information
        if (
          !formData.vehicle_type ||
          !formData.vehicle_make ||
          !formData.vehicle_model ||
          !formData.vehicle_year ||
          !formData.license_plate
        ) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required vehicle information fields",
            variant: "destructive",
          })
          return false
        }
        break
      case 3: // License & Insurance
        if (
          !formData.drivers_license ||
          !formData.license_expiry_date ||
          !formData.insurance_provider ||
          !formData.insurance_policy_number ||
          !formData.insurance_expiry_date
        ) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required license and insurance fields",
            variant: "destructive",
          })
          return false
        }
        break
      case 4: // Banking Information
        if (
          !formData.bank_name ||
          !formData.bank_account_holder ||
          !formData.account_number ||
          !formData.bank_branch_code
        ) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required banking information fields",
            variant: "destructive",
          })
          return false
        }
        break
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)

    try {
      // Update profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        user_type: "driver",
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      // Update or insert driver data
      const { error: driverError } = await supabase.from("drivers").upsert({
        id: userId,
        vehicle_type: formData.vehicle_type,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: Number.parseInt(formData.vehicle_year),
        vehicle_color: formData.vehicle_color,
        vehicle_capacity: formData.vehicle_capacity,
        license_plate: formData.license_plate,
        drivers_license: formData.drivers_license,
        license_expiry_date: formData.license_expiry_date,
        pdp_number: formData.pdp_number || null,
        pdp_expiry_date: formData.pdp_expiry_date || null,
        insurance_provider: formData.insurance_provider,
        insurance_policy_number: formData.insurance_policy_number,
        insurance_expiry_date: formData.insurance_expiry_date,
        bank_name: formData.bank_name,
        bank_account_holder: formData.bank_account_holder,
        account_number: formData.account_number,
        bank_branch_code: formData.bank_branch_code,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        verification_status: "documents_submitted",
        updated_at: new Date().toISOString(),
      })

      if (driverError) throw driverError

      toast({
        title: "Profile Submitted",
        description: "Your driver profile has been submitted for verification",
      })

      onComplete?.()
    } catch (error: any) {
      console.error("[v0] Error submitting driver profile:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit driver profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-white">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-white">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="+27 82 123 4567"
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
                disabled
                className="bg-slate-700/50 border-slate-600 text-white/70"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
            </div>

            <div>
              <Label htmlFor="vehicle_type" className="text-white">
                Vehicle Type *
              </Label>
              <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange("vehicle_type", value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="bakkie">Bakkie/Pickup</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck_small">Small Truck (1-3 tons)</SelectItem>
                  <SelectItem value="truck_medium">Medium Truck (3-8 tons)</SelectItem>
                  <SelectItem value="truck_large">Large Truck (8+ tons)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_make" className="text-white">
                  Make *
                </Label>
                <Input
                  id="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => handleInputChange("vehicle_make", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Toyota"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_model" className="text-white">
                  Model *
                </Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => handleInputChange("vehicle_model", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Hilux"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_year" className="text-white">
                  Year *
                </Label>
                <Input
                  id="vehicle_year"
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => handleInputChange("vehicle_year", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="2020"
                  min="2010"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_color" className="text-white">
                  Color
                </Label>
                <Input
                  id="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={(e) => handleInputChange("vehicle_color", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="White"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_plate" className="text-white">
                  License Plate *
                </Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange("license_plate", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="ABC 123 GP"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_capacity" className="text-white">
                  Load Capacity
                </Label>
                <Input
                  id="vehicle_capacity"
                  value={formData.vehicle_capacity}
                  onChange={(e) => handleInputChange("vehicle_capacity", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="1000kg"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">License & Insurance</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="drivers_license" className="text-white">
                  Driver's License Number *
                </Label>
                <Input
                  id="drivers_license"
                  value={formData.drivers_license}
                  onChange={(e) => handleInputChange("drivers_license", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="1234567890123"
                />
              </div>
              <div>
                <Label htmlFor="license_expiry_date" className="text-white">
                  License Expiry Date *
                </Label>
                <Input
                  id="license_expiry_date"
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => handleInputChange("license_expiry_date", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pdp_number" className="text-white">
                  PDP Number (Optional)
                </Label>
                <Input
                  id="pdp_number"
                  value={formData.pdp_number}
                  onChange={(e) => handleInputChange("pdp_number", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="PDP123456"
                />
              </div>
              <div>
                <Label htmlFor="pdp_expiry_date" className="text-white">
                  PDP Expiry Date
                </Label>
                <Input
                  id="pdp_expiry_date"
                  type="date"
                  value={formData.pdp_expiry_date}
                  onChange={(e) => handleInputChange("pdp_expiry_date", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="insurance_provider" className="text-white">
                Insurance Provider *
              </Label>
              <Input
                id="insurance_provider"
                value={formData.insurance_provider}
                onChange={(e) => handleInputChange("insurance_provider", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Santam, OUTsurance, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insurance_policy_number" className="text-white">
                  Policy Number *
                </Label>
                <Input
                  id="insurance_policy_number"
                  value={formData.insurance_policy_number}
                  onChange={(e) => handleInputChange("insurance_policy_number", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="POL123456789"
                />
              </div>
              <div>
                <Label htmlFor="insurance_expiry_date" className="text-white">
                  Insurance Expiry *
                </Label>
                <Input
                  id="insurance_expiry_date"
                  type="date"
                  value={formData.insurance_expiry_date}
                  onChange={(e) => handleInputChange("insurance_expiry_date", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Banking Information</h3>
            </div>

            <div>
              <Label htmlFor="bank_name" className="text-white">
                Bank Name *
              </Label>
              <Select value={formData.bank_name} onValueChange={(value) => handleInputChange("bank_name", value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="absa">ABSA</SelectItem>
                  <SelectItem value="fnb">FNB</SelectItem>
                  <SelectItem value="standard_bank">Standard Bank</SelectItem>
                  <SelectItem value="nedbank">Nedbank</SelectItem>
                  <SelectItem value="capitec">Capitec</SelectItem>
                  <SelectItem value="african_bank">African Bank</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bank_account_holder" className="text-white">
                Account Holder Name *
              </Label>
              <Input
                id="bank_account_holder"
                value={formData.bank_account_holder}
                onChange={(e) => handleInputChange("bank_account_holder", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Full name as per bank account"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_number" className="text-white">
                  Account Number *
                </Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange("account_number", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label htmlFor="bank_branch_code" className="text-white">
                  Branch Code *
                </Label>
                <Input
                  id="bank_branch_code"
                  value={formData.bank_branch_code}
                  onChange={(e) => handleInputChange("bank_branch_code", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="250655"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                Your banking information is encrypted and secure. This is where your earnings will be deposited.
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Emergency Contact</h3>
            </div>

            <div>
              <Label htmlFor="emergency_contact_name" className="text-white">
                Contact Name
              </Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone" className="text-white">
                Contact Phone
              </Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="+27 82 987 6543"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_relationship" className="text-white">
                Relationship
              </Label>
              <Input
                id="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Spouse, Parent, Sibling, etc."
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <DriverDocumentUpload
              driverId={userId}
              onDocumentsUpdate={() => {
                toast({
                  title: "Documents Updated",
                  description: "Your documents have been saved",
                })
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Vehicle" },
    { number: 3, title: "License & Insurance" },
    { number: 4, title: "Banking" },
    { number: 5, title: "Emergency Contact" },
    { number: 6, title: "Documents" },
  ]

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Driver Profile & Verification</CardTitle>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step.number ? "bg-orange-500 text-white" : "bg-slate-700 text-gray-400"
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs text-gray-400 mt-1 hidden sm:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 ${currentStep > step.number ? "bg-orange-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {onCancel && currentStep === 1 && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              Cancel
            </Button>
          )}

          {currentStep < 6 ? (
            <Button onClick={handleNext} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
