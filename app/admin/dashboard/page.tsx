import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all drivers pending verification
  const { data: pendingDrivers } = await supabase
    .from("drivers")
    .select(`
      *,
      profiles:profiles(*)
    `)
    .eq("status", "pending_verification")
    .order("created_at", { ascending: false })

  // Get all verified drivers
  const { data: verifiedDrivers } = await supabase
    .from("drivers")
    .select(`
      *,
      profiles:profiles(*)
    `)
    .eq("status", "verified")
    .order("created_at", { ascending: false })

  return <AdminDashboard pendingDrivers={pendingDrivers || []} verifiedDrivers={verifiedDrivers || []} />
}
