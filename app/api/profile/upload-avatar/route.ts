import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Get current avatar URL to delete old one
    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

    // Delete old avatar if exists
    if (profile?.avatar_url) {
      try {
        await del(profile.avatar_url)
      } catch (error) {
        console.error("Failed to delete old avatar:", error)
      }
    }

    // Upload new avatar to Vercel Blob
    const fileExt = file.name.split(".").pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`

    const blob = await put(fileName, file, {
      access: "public",
    })

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: blob.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      url: blob.url,
      filename: fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
