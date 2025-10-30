"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { Activity } from "lucide-react"

interface DeliveryStatsChartProps {
  data: Array<{
    date: string
    completed: number
    cancelled: number
    total: number
  }>
}

export function DeliveryStatsChart({ data }: DeliveryStatsChartProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Delivery Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
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
            />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
            <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
