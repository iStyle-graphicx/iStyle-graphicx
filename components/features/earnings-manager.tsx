"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, Calendar, Download, CreditCard, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface EarningsManagerProps {
  driverId: string
}

interface EarningsData {
  today: number
  week: number
  month: number
  total: number
  pending: number
  available: number
}

interface Transaction {
  id: string
  amount: number
  type: "earning" | "payout" | "bonus"
  status: "completed" | "pending" | "processing"
  date: string
  description: string
}

export function EarningsManager({ driverId }: EarningsManagerProps) {
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    pending: 0,
    available: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchEarningsData()
  }, [driverId])

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true)

      // Fetch driver data
      const { data: driverData } = await supabase.from("drivers").select("*").eq("id", driverId).single()

      // Fetch deliveries
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*")
        .eq("driver_id", driverId)
        .eq("status", "delivered")

      if (deliveries) {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const todayEarnings = deliveries
          .filter((d) => new Date(d.delivered_at) >= todayStart)
          .reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)

        const weekEarnings = deliveries
          .filter((d) => new Date(d.delivered_at) >= weekStart)
          .reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)

        const monthEarnings = deliveries
          .filter((d) => new Date(d.delivered_at) >= monthStart)
          .reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)

        const totalEarnings = driverData?.total_earnings || 0
        const pendingEarnings = deliveries
          .filter((d) => !d.paid_to_driver)
          .reduce((sum, d) => sum + d.delivery_fee * 0.6, 0)

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          month: monthEarnings,
          total: totalEarnings,
          pending: pendingEarnings,
          available: totalEarnings - pendingEarnings,
        })

        // Create transaction history
        const transactionHistory: Transaction[] = deliveries.slice(0, 10).map((d) => ({
          id: d.id,
          amount: d.delivery_fee * 0.6,
          type: "earning" as const,
          status: d.paid_to_driver ? "completed" : "pending",
          date: d.delivered_at,
          description: `Delivery to ${d.delivery_address.substring(0, 30)}...`,
        }))

        setTransactions(transactionHistory)
      }
    } catch (error) {
      console.error("Error fetching earnings:", error)
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const requestPayout = async () => {
    if (earnings.available < 100) {
      toast({
        title: "Minimum Not Met",
        description: "Minimum payout amount is R100",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayout(true)

    try {
      // In a real app, this would integrate with a payment processor
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Payout Requested",
        description: `R${earnings.available.toFixed(2)} will be transferred to your account within 1-2 business days`,
      })

      fetchEarningsData()
    } catch (error) {
      console.error("Error requesting payout:", error)
      toast({
        title: "Error",
        description: "Failed to process payout request",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayout(false)
    }
  }

  const exportStatement = () => {
    toast({
      title: "Export Started",
      description: "Your earnings statement is being generated...",
    })
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Earnings</h2>
          <p className="text-gray-400 text-sm">Manage your income and payouts</p>
        </div>
        <Button
          onClick={exportStatement}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{earnings.today.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{earnings.week.toFixed(0)}</p>
                <p className="text-xs text-gray-400">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{earnings.month.toFixed(0)}</p>
                <p className="text-xs text-gray-400">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">R{earnings.total.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Available for Payout</p>
              <p className="text-3xl font-bold text-white">R{earnings.available.toFixed(2)}</p>
            </div>
            <Button
              onClick={requestPayout}
              disabled={isProcessingPayout || earnings.available < 100}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isProcessingPayout ? "Processing..." : "Request Payout"}
            </Button>
          </div>

          {earnings.pending > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div>
                <p className="text-sm text-gray-300">Pending Earnings</p>
                <p className="text-lg font-semibold text-yellow-400">R{earnings.pending.toFixed(2)}</p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge>
            </div>
          )}

          <p className="text-xs text-gray-400">Minimum payout: R100 • Processing time: 1-2 business days</p>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{transaction.description}</p>
                      <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">+R{transaction.amount.toFixed(2)}</p>
                    <Badge
                      className={
                        transaction.status === "completed"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-4">
              {transactions
                .filter((t) => t.status === "completed")
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-400">+R{transaction.amount.toFixed(2)}</p>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {transactions
                .filter((t) => t.status === "pending")
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-yellow-400">+R{transaction.amount.toFixed(2)}</p>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
