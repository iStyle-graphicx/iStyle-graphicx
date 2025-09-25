"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Camera, X, User } from "lucide-react"

interface ProfileAvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onAvatarUpdate: (url: string) => void
  size?: "sm" | "md" | "lg"
  editable?: boolean
}

export function ProfileAvatarUpload({
  userId,
  currentAvatarUrl,
  onAvatarUpdate,
  size = "md",
  editable = true,
}: ProfileAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  }

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  const buttonSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPreviewUrl(previewUrl)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("user-uploads").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-uploads").getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      onAvatarUpdate(publicUrl)
      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully",
      })
    } catch (error: any) {
      console.error("[v0] Avatar upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to update profile photo",
        variant: "destructive",
      })
      // Reset preview on error
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw error
      }

      setPreviewUrl(null)
      onAvatarUpdate("")
      toast({
        title: "Avatar removed",
        description: "Your profile photo has been removed",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove profile photo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} bg-orange-500 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white/20`}
      >
        {previewUrl ? (
          <img src={previewUrl || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className={iconSizes[size]} />
        )}
      </div>

      {editable && (
        <>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
            className={`absolute -bottom-1 -right-1 ${buttonSizes[size]} bg-orange-500 hover:bg-orange-600 text-white rounded-full p-0 border-2 border-white`}
          >
            {isUploading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </Button>

          {previewUrl && (
            <Button
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              size="sm"
              className={`absolute -top-1 -right-1 ${buttonSizes[size]} bg-red-500 hover:bg-red-600 text-white rounded-full p-0 border-2 border-white`}
            >
              <X className="w-3 h-3" />
            </Button>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </>
      )}
    </div>
  )
}
