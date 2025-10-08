import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DriverDashboard from "@/components/driver/driver-dashboard"

export default async function DriverDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?role=driver")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.user_type !== "driver") {
    redirect("/customer/dashboard")
  }

  const { data: driver } = await supabase.from("drivers").select("*").eq("id", user.id).single()

  // If driver hasn't completed profile setup, redirect
  if (driver?.status === "pending_verification" && !driver.vehicle_type) {
    redirect("/driver/profile-setup")
  }

  return <DriverDashboard user={user} profile={profile} driver={driver} />
}
