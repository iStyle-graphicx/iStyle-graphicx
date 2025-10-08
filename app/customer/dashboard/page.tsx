import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CustomerDashboard from "@/components/customer/customer-dashboard"

export default async function CustomerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?role=customer")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.user_type !== "customer") {
    redirect("/driver/dashboard")
  }

  return <CustomerDashboard user={user} profile={profile} />
}
