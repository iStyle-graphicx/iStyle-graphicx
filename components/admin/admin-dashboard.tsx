"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Eye, Users, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Driver {
  id: string
  vehicle_type: string
  license_plate: string
  drivers_license: string
  account_number: string
  status: string
  created_at: string
  profiles: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

interface AdminDashboardProps {
  pendingDrivers: Driver[]
  verifiedDrivers: Driver[]
}

export default function AdminDashboard({
  pendingDrivers: initialPending,
  verifiedDrivers: initialVerified,
}: AdminDashboardProps) {
  const [pendingDrivers, setPendingDrivers] = useState(initialPending)
  const [verifiedDrivers, setVerifiedDrivers] = useState(initialVerified)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleVerify = async (driverId: string, approved: boolean) => {
    setIsProcessing(true)
    try {
      const supabase = createClient()

      const newStatus = approved ? "verified" : "rejected"

      const { error } = await supabase.from("drivers").update({ status: newStatus }).eq("id", driverId)

      if (error) throw error

      // Update verification record
      await supabase
        .from("user_verifications")
        .update({
          driver_license_verified: approved,
          vehicle_verified: approved,
        })
        .eq("user_id", driverId)

      // Send notification to driver
      await supabase.from("notifications").insert({
        user_id: driverId,
        type: "verification_status",
        title: approved ? "Verification Approved" : "Verification Rejected",
        message: approved
          ? "Congratulations! Your driver profile has been verified. You can now start accepting deliveries."
          : "Unfortunately, your verification was not approved. Please contact support for more information.",
        is_read: false,
      })

      // Update local state
      const driver = pendingDrivers.find((d) => d.id === driverId)
      if (driver) {
        setPendingDrivers(pendingDrivers.filter((d) => d.id !== driverId))
        if (approved) {
          setVerifiedDrivers([{ ...driver, status: newStatus }, ...verifiedDrivers])
        }
      }

      setSelectedDriver(null)
      router.refresh()
    } catch (error) {
      console.error("Verification error:", error)
      alert("Failed to update verification status")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">VANGO Admin Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDrivers.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Drivers</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedDrivers.length}</div>
              <p className="text-xs text-muted-foreground">Active drivers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDrivers.length + verifiedDrivers.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Verification ({pendingDrivers.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified Drivers ({verifiedDrivers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drivers Awaiting Verification</CardTitle>
                <CardDescription>Review and approve driver applications</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending verifications</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">
                            {driver.profiles.first_name} {driver.profiles.last_name}
                          </TableCell>
                          <TableCell>{driver.profiles.email}</TableCell>
                          <TableCell>{driver.profiles.phone}</TableCell>
                          <TableCell className="capitalize">{driver.vehicle_type || "N/A"}</TableCell>
                          <TableCell>{driver.license_plate || "N/A"}</TableCell>
                          <TableCell>{new Date(driver.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Driver Verification</DialogTitle>
                                  <DialogDescription>Review driver information and documents</DialogDescription>
                                </DialogHeader>
                                {selectedDriver && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Name</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedDriver.profiles.first_name} {selectedDriver.profiles.last_name}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{selectedDriver.profiles.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{selectedDriver.profiles.phone}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Vehicle Type</p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                          {selectedDriver.vehicle_type || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">License Plate</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedDriver.license_plate || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Driver's License</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedDriver.drivers_license || "N/A"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        className="flex-1"
                                        onClick={() => handleVerify(selectedDriver.id, true)}
                                        disabled={isProcessing}
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleVerify(selectedDriver.id, false)}
                                        disabled={isProcessing}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verified Drivers</CardTitle>
                <CardDescription>All approved drivers on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {verifiedDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No verified drivers yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">
                            {driver.profiles.first_name} {driver.profiles.last_name}
                          </TableCell>
                          <TableCell>{driver.profiles.email}</TableCell>
                          <TableCell>{driver.profiles.phone}</TableCell>
                          <TableCell className="capitalize">{driver.vehicle_type}</TableCell>
                          <TableCell>{driver.license_plate}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">Verified</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
