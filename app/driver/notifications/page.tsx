import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NotificationsPage from "@/components/driver/notifications-page"

export default async function DriverNotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?role=driver")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <NotificationsPage notifications={notifications || []} />
}
