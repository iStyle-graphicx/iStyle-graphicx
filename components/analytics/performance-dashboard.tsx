"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, Users, TrendingUp, AlertTriangle, RefreshCw, Eye, Smartphone } from "lucide-react"
import { monitorMemoryUsage } from "@/lib/performance"
import { useAnalytics } from "@/lib/analytics"

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [memoryUsage, setMemoryUsage] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const analytics = useAnalytics()

  const refreshData = async () => {
    setIsRefreshing(true)

    // Get memory usage
    const memory = monitorMemoryUsage()
    setMemoryUsage(memory)

    // Get analytics summary
    const summary = analytics.generateSummary()
    setAnalyticsData(summary)

    // Get performance metrics (simulated for demo)
    const perf = {
      pageLoadTime: Math.random() * 2000 + 500,
      apiResponseTime: Math.random() * 500 + 100,
      renderTime: Math.random() * 100 + 20,
      errorRate: Math.random() * 5,
      uptime: 99.8 + Math.random() * 0.2,
    }
    setPerformanceData(perf)

    setTimeout(() => setIsRefreshing(false), 1000)
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (!performanceData || !analyticsData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="vango-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} size="sm" className="bg-orange-500 hover:bg-orange-600">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="vango-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Page Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{performanceData.pageLoadTime.toFixed(0)}ms</div>
            <Badge variant={performanceData.pageLoadTime < 1000 ? "default" : "destructive"} className="mt-1">
              {performanceData.pageLoadTime < 1000 ? "Good" : "Needs Improvement"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="vango-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{performanceData.apiResponseTime.toFixed(0)}ms</div>
            <Badge variant={performanceData.apiResponseTime < 300 ? "default" : "secondary"} className="mt-1">
              {performanceData.apiResponseTime < 300 ? "Fast" : "Average"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="vango-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{performanceData.errorRate.toFixed(1)}%</div>
            <Badge variant={performanceData.errorRate < 2 ? "default" : "destructive"} className="mt-1">
              {performanceData.errorRate < 2 ? "Low" : "High"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="vango-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{performanceData.uptime.toFixed(1)}%</div>
            <Badge variant="default" className="mt-1">
              Excellent
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Memory Usage */}
      {memoryUsage && (
        <Card className="vango-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-400" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Used: {memoryUsage.used}MB</span>
              <span>Total: {memoryUsage.total}MB</span>
              <span>Limit: {memoryUsage.limit}MB</span>
            </div>
            <Progress value={(memoryUsage.used / memoryUsage.limit) * 100} className="h-2" />
            <div className="text-xs text-gray-400">
              Memory usage: {((memoryUsage.used / memoryUsage.limit) * 100).toFixed(1)}% of limit
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="vango-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{analyticsData.totalEvents}</div>
                <div className="text-xs text-gray-400">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{analyticsData.recentEvents}</div>
                <div className="text-xs text-gray-400">Last Hour</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{analyticsData.todayEvents}</div>
                <div className="text-xs text-gray-400">Today</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Top Events</h4>
              {analyticsData.topEvents.slice(0, 3).map(([event, count]: [string, number]) => (
                <div key={event} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 capitalize">{event.replace("_", " ")}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="vango-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Most Visited Pages</h4>
              {analyticsData.topPages.slice(0, 5).map(([page, count]: [string, number]) => (
                <div key={page} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 truncate">{page || "Home"}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400">Session ID: {analyticsData.sessionId.slice(-8)}</div>
              {analyticsData.userId && <div className="text-xs text-gray-400">User ID: {analyticsData.userId}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Performance Chart Placeholder */}
      <Card className="vango-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Real-time performance charts would appear here</p>
              <p className="text-xs">Integration with monitoring service required</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
