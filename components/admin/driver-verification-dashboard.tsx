"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Car,
  FileText,
  Search,
  Eye,
  AlertCircle,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react"

interface DriverApplication {
  id: string
  profiles: {
    first_name: string
    last_name: string
    phone: string
    email: string
  }
  vehicle_type: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  license_plate: string
  drivers_license: string
  license_expiry_date: string
  insurance_provider: string
  insurance_policy_number: string
  insurance_expiry_date: string
  bank_name: string
  account_number: string
  verification_status: string
  verification_notes: string
  created_at: string
  updated_at: string
}

interface VerificationDocuments {
  [key: string]: {
    url: string
    filename: string
    uploadedAt: string
    status: "pending" | "approved" | "rejected"
  }
}

export function DriverVerificationDashboard() {
  const [applications, setApplications] = useState<DriverApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null)
  const [documents, setDocuments] = useState<VerificationDocuments>({})
  const [verificationNotes, setVerificationNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; filename: string } | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, [filterStatus])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("drivers")
        .select(
          `
          *,
          profiles!inner(first_name, last_name, phone)
        `,
        )
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("verification_status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      // Get user emails
      const applicationsWithEmails = await Promise.all(
        (data || []).map(async (app) => {
          const { data: userData } = await supabase.auth.admin.getUserById(app.id)
          return {
            ...app,
            profiles: {
              ...app.profiles,
              email: userData?.user?.email || "N/A",
            },
          }
        }),
      )

      setApplications(applicationsWithEmails as any)
    } catch (error: any) {
      console.error("[v0] Error fetching applications:", error)
      toast({
        title: "Error",
        description: "Failed to load driver applications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_verifications")
        .select("verification_documents")
        .eq("user_id", driverId)
        .single()

      if (data?.verification_documents) {
        setDocuments(data.verification_documents as VerificationDocuments)
      } else {
        setDocuments({})
      }
    } catch (error) {
      console.error("[v0] Error loading documents:", error)
      setDocuments({})
    }
  }

  const handleSelectApplication = (application: DriverApplication) => {
    setSelectedApplication(application)
    setVerificationNotes(application.verification_notes || "")
    loadDocuments(application.id)
  }

  const handleApproveDocument = async (documentType: string) => {
    if (!selectedApplication) return

    try {
      const updatedDocuments = {
        ...documents,
        [documentType]: {
          ...documents[documentType],
          status: "approved" as const,
        },
      }

      await supabase
        .from("user_verifications")
        .update({
          verification_documents: updatedDocuments,
          [`${documentType}_verified`]: true,
        })
        .eq("user_id", selectedApplication.id)

      setDocuments(updatedDocuments)

      toast({
        title: "Document Approved",
        description: "The document has been approved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive",
      })
    }
  }

  const handleRejectDocument = async (documentType: string) => {
    if (!selectedApplication) return

    try {
      const updatedDocuments = {
        ...documents,
        [documentType]: {
          ...documents[documentType],
          status: "rejected" as const,
        },
      }

      await supabase
        .from("user_verifications")
        .update({
          verification_documents: updatedDocuments,
          [`${documentType}_verified`]: false,
        })
        .eq("user_id", selectedApplication.id)

      setDocuments(updatedDocuments)

      toast({
        title: "Document Rejected",
        description: "The document has been rejected",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      })
    }
  }

  const handleApproveApplication = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          verification_status: "approved",
          status: "active",
          verification_notes: verificationNotes,
          verified_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id)

      if (error) throw error

      // Send notification to driver
      await supabase.from("notifications").insert({
        user_id: selectedApplication.id,
        title: "Application Approved!",
        message: "Congratulations! Your driver application has been approved. You can now start accepting deliveries.",
        type: "success",
        is_read: false,
      })

      toast({
        title: "Application Approved",
        description: "The driver application has been approved",
      })

      fetchApplications()
      setSelectedApplication(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectApplication = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          verification_status: "rejected",
          verification_notes: verificationNotes,
        })
        .eq("id", selectedApplication.id)

      if (error) throw error

      // Send notification to driver
      await supabase.from("notifications").insert({
        user_id: selectedApplication.id,
        title: "Application Requires Attention",
        message: `Your driver application needs additional information. Reason: ${verificationNotes}`,
        type: "warning",
        is_read: false,
      })

      toast({
        title: "Application Rejected",
        description: "The driver has been notified",
      })

      fetchApplications()
      setSelectedApplication(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-gray-500", label: "Pending" },
      documents_submitted: { color: "bg-yellow-500", label: "Under Review" },
      under_review: { color: "bg-blue-500", label: "Under Review" },
      approved: { color: "bg-green-500", label: "Approved" },
      rejected: { color: "bg-red-500", label: "Rejected" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const filteredApplications = applications.filter((app) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      app.profiles.first_name.toLowerCase().includes(searchLower) ||
      app.profiles.last_name.toLowerCase().includes(searchLower) ||
      app.license_plate.toLowerCase().includes(searchLower) ||
      app.vehicle_make.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(
      (a) => a.verification_status === "pending" || a.verification_status === "documents_submitted",
    ).length,
    approved: applications.filter((a) => a.verification_status === "approved").length,
    rejected: applications.filter((a) => a.verification_status === "rejected").length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Verification Dashboard</h1>
          <p className="text-gray-400 mt-1">Review and approve driver applications</p>
        </div>
        <Shield className="w-12 h-12 text-orange-500" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <Card className="lg:col-span-1 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Applications</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drivers..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="documents_submitted">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No applications found</div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleSelectApplication(app)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedApplication?.id === app.id
                      ? "bg-orange-500/20 border border-orange-500"
                      : "bg-slate-700/50 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">
                        {app.profiles.first_name} {app.profiles.last_name}
                      </p>
                      <p className="text-sm text-gray-400">{app.license_plate}</p>
                    </div>
                    {getStatusBadge(app.verification_status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Car className="w-3 h-3" />
                    <span>
                      {app.vehicle_make} {app.vehicle_model}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card className="lg:col-span-2 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedApplication ? "Application Details" : "Select an Application"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedApplication ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select an application from the list to view details</p>
              </div>
            ) : (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Name</p>
                        <p className="text-white">
                          {selectedApplication.profiles.first_name} {selectedApplication.profiles.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <p className="text-white flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedApplication.profiles.phone}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">Email</p>
                        <p className="text-white flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedApplication.profiles.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Car className="w-4 h-4 text-orange-500" />
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="text-white capitalize">{selectedApplication.vehicle_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Make & Model</p>
                        <p className="text-white">
                          {selectedApplication.vehicle_make} {selectedApplication.vehicle_model}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Year</p>
                        <p className="text-white">{selectedApplication.vehicle_year}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">License Plate</p>
                        <p className="text-white font-mono">{selectedApplication.license_plate}</p>
                      </div>
                    </div>
                  </div>

                  {/* License & Insurance */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-500" />
                      License & Insurance
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Driver's License</p>
                        <p className="text-white font-mono">{selectedApplication.drivers_license}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">License Expiry</p>
                        <p className="text-white">
                          {new Date(selectedApplication.license_expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Insurance Provider</p>
                        <p className="text-white">{selectedApplication.insurance_provider}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Policy Number</p>
                        <p className="text-white font-mono">{selectedApplication.insurance_policy_number}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">Insurance Expiry</p>
                        <p className="text-white">
                          {new Date(selectedApplication.insurance_expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-orange-500" />
                      Banking Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Bank</p>
                        <p className="text-white capitalize">{selectedApplication.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Account Number</p>
                        <p className="text-white font-mono">{selectedApplication.account_number}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  {Object.keys(documents).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  ) : (
                    Object.entries(documents).map(([docType, doc]) => (
                      <div key={docType} className="p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium capitalize">{docType.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-400">{doc.filename}</p>
                          </div>
                          <Badge
                            className={
                              doc.status === "approved"
                                ? "bg-green-500/20 text-green-400"
                                : doc.status === "rejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => setPreviewDoc({ url: doc.url, filename: doc.filename })}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {doc.status !== "approved" && (
                            <Button
                              onClick={() => handleApproveDocument(docType)}
                              size="sm"
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          )}
                          {doc.status !== "rejected" && (
                            <Button
                              onClick={() => handleRejectDocument(docType)}
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="review" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="notes" className="text-white mb-2 block">
                      Verification Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add notes about this application..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApproveApplication}
                      disabled={isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      onClick={handleRejectApplication}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>

                  {selectedApplication.verification_notes && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm font-medium mb-1">Previous Notes:</p>
                      <p className="text-blue-200 text-sm">{selectedApplication.verification_notes}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h3 className="text-white font-semibold">{previewDoc.filename}</h3>
              <Button
                onClick={() => setPreviewDoc(null)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              {previewDoc.url.endsWith(".pdf") ? (
                <iframe src={previewDoc.url} className="w-full h-[70vh]" />
              ) : (
                <img src={previewDoc.url || "/placeholder.svg"} alt="Document preview" className="w-full h-auto" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
