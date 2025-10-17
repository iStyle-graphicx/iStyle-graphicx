"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye } from "lucide-react"
import { put } from "@vercel/blob"

interface DocumentType {
  id: string
  label: string
  description: string
  required: boolean
  acceptedFormats: string
}

interface UploadedDocument {
  type: string
  url: string
  filename: string
  uploadedAt: string
  status: "pending" | "approved" | "rejected"
}

interface DriverDocumentUploadProps {
  driverId: string
  onDocumentsUpdate?: () => void
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "identity_document",
    label: "Identity Document (ID/Passport)",
    description: "Clear photo of your South African ID or Passport",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "drivers_license",
    label: "Driver's License",
    description: "Valid driver's license (both sides if card format)",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "vehicle_registration",
    label: "Vehicle Registration (License Disc)",
    description: "Current vehicle registration certificate",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "vehicle_insurance",
    label: "Vehicle Insurance",
    description: "Proof of comprehensive vehicle insurance",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "proof_of_address",
    label: "Proof of Residence",
    description: "Utility bill or bank statement (not older than 3 months)",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "pdp_permit",
    label: "Professional Driving Permit (PDP)",
    description: "Required for commercial driving in South Africa",
    required: false,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
  {
    id: "vehicle_inspection",
    label: "Vehicle Roadworthy Certificate",
    description: "Recent vehicle inspection certificate",
    required: false,
    acceptedFormats: ".jpg,.jpeg,.png,.pdf",
  },
]

export function DriverDocumentUpload({ driverId, onDocumentsUpdate }: DriverDocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({})
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const { toast } = useToast()
  const supabase = createClient()

  // Load existing documents on mount
  useEffect(() => {
    loadExistingDocuments()
  }, [driverId])

  const loadExistingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_verifications")
        .select("verification_documents")
        .eq("user_id", driverId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading documents:", error)
        return
      }

      if (data?.verification_documents) {
        setUploadedDocuments(data.verification_documents as Record<string, UploadedDocument>)
      }
    } catch (error) {
      console.error("Error loading documents:", error)
    }
  }

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setUploadingDoc(documentType)

    try {
      // Upload to Vercel Blob
      const blob = await put(`driver-documents/${driverId}/${documentType}-${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      const newDocument: UploadedDocument = {
        type: documentType,
        url: blob.url,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      }

      // Update local state
      const updatedDocuments = {
        ...uploadedDocuments,
        [documentType]: newDocument,
      }
      setUploadedDocuments(updatedDocuments)

      // Save to database with upsert
      const { error: upsertError } = await supabase.from("user_verifications").upsert(
        {
          user_id: driverId,
          verification_documents: updatedDocuments,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (upsertError) {
        throw new Error(`Failed to save document: ${upsertError.message}`)
      }

      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and is pending verification",
      })

      onDocumentsUpdate?.()
    } catch (error: any) {
      console.error("Document upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingDoc(null)
      // Reset file input
      if (fileInputRefs.current[documentType]) {
        fileInputRefs.current[documentType]!.value = ""
      }
    }
  }

  const handleRemoveDocument = async (documentType: string) => {
    try {
      const updatedDocuments = { ...uploadedDocuments }
      delete updatedDocuments[documentType]
      setUploadedDocuments(updatedDocuments)

      await supabase
        .from("user_verifications")
        .update({
          verification_documents: updatedDocuments,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", driverId)

      toast({
        title: "Document removed",
        description: "The document has been removed",
      })

      onDocumentsUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive",
      })
    }
  }

  const getDocumentStatus = (documentType: string) => {
    const doc = uploadedDocuments[documentType]
    if (!doc) return null

    const statusConfig = {
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending Review" },
      approved: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Approved" },
      rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejected" },
    }

    return statusConfig[doc.status]
  }

  const requiredDocsCount = DOCUMENT_TYPES.filter((d) => d.required).length
  const uploadedRequiredCount = DOCUMENT_TYPES.filter((d) => d.required && uploadedDocuments[d.id]).length
  const completionPercentage = Math.round((uploadedRequiredCount / requiredDocsCount) * 100)

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Driver Documents
          </CardTitle>
          <Badge className={`${completionPercentage === 100 ? "bg-green-500" : "bg-orange-500"}`}>
            {uploadedRequiredCount}/{requiredDocsCount} Required
          </Badge>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              completionPercentage === 100 ? "bg-green-500" : "bg-orange-500"
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const uploadedDoc = uploadedDocuments[docType.id]
          const status = getDocumentStatus(docType.id)
          const isUploading = uploadingDoc === docType.id

          return (
            <div key={docType.id} className="p-4 bg-slate-700/30 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium text-sm">{docType.label}</h4>
                    {docType.required && (
                      <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{docType.description}</p>
                  <p className="text-gray-500 text-xs mt-1">Accepted: {docType.acceptedFormats}</p>
                </div>

                {uploadedDoc ? (
                  <div className="flex items-center gap-2">
                    {status && <Badge className={status.color}>{status.label}</Badge>}
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {uploadedDoc ? (
                <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded border border-slate-600">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{uploadedDoc.filename}</p>
                    <p className="text-gray-400 text-xs">
                      Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPreviewDoc(uploadedDoc)}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleRemoveDocument(docType.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    ref={(el) => (fileInputRefs.current[docType.id] = el)}
                    type="file"
                    accept={docType.acceptedFormats}
                    onChange={(e) => handleFileSelect(docType.id, e)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRefs.current[docType.id]?.click()}
                    disabled={isUploading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {docType.label}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {completionPercentage < 100 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 font-medium text-sm">Documents Required</p>
                <p className="text-yellow-200 text-xs mt-1">
                  Please upload all required documents to complete your driver verification and start accepting
                  deliveries.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">{previewDoc.filename}</h3>
              <Button
                onClick={() => setPreviewDoc(null)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
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
    </Card>
  )
}
