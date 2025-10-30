"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface EarningsChartProps {
  data: Array<{ date: string; earnings: number }>
  period: "week" | "month" | "year"
  totalEarnings: number
  change: number
}

export function EarningsChart({ data, period, totalEarnings, change }: EarningsChartProps) {
  const isPositive = change >= 0

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Earnings Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold text-white">R{totalEarnings.toFixed(2)}</p>
          <p className="text-sm text-gray-400">
            Total for this {period === "week" ? "week" : period === "month" ? "month" : "year"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [`R${value.toFixed(2)}`, "Earnings"]}
            />
            <Bar dataKey="earnings" fill="#f97316" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
