"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Package, MapPin, Calendar, Search, Filter, Download, Eye, Star } from "lucide-react"

interface Delivery {
  id: string
  tracking_code: string
  pickup_address: string
  delivery_address: string
  item_description: string
  delivery_fee: number
  status: "pending" | "in_transit" | "delivered" | "cancelled"
  created_at: string
  completed_at?: string
  driver_name?: string
  rating?: number
}

export function DeliveryHistorySection() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadDeliveryHistory()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, statusFilter, timeFilter, searchQuery])

  const loadDeliveryHistory = async () => {
    setIsLoading(true)

    // Load sample delivery history
    const sampleDeliveries: Delivery[] = [
      {
        id: "1",
        tracking_code: "VAN123456",
        pickup_address: "Mabopane Hardware Store, Pretoria",
        delivery_address: "Construction Site, Rosslyn",
        item_description: "Cement bags - 500kg",
        delivery_fee: 245.0,
        status: "delivered",
        created_at: "2023-05-15T08:30:00Z",
        completed_at: "2023-05-15T14:45:00Z",
        driver_name: "John Smith",
        rating: 5,
      },
      {
        id: "2",
        tracking_code: "VAN654321",
        pickup_address: "Tool Center, Pretoria CBD",
        delivery_address: "Residence, Soshanguve",
        item_description: "Power tools and equipment - 25kg",
        delivery_fee: 185.0,
        status: "in_transit",
        created_at: "2023-05-18T10:15:00Z",
        driver_name: "Sarah Johnson",
      },
      {
        id: "3",
        tracking_code: "VAN789012",
        pickup_address: "Steel Supplier, Centurion",
        delivery_address: "Workshop, Mamelodi",
        item_description: "Metal sheets - 150kg",
        delivery_fee: 320.0,
        status: "delivered",
        created_at: "2023-05-10T09:00:00Z",
        completed_at: "2023-05-10T16:30:00Z",
        driver_name: "Mike Williams",
        rating: 4,
      },
      {
        id: "4",
        tracking_code: "VAN345678",
        pickup_address: "Brick Yard, Hammanskraal",
        delivery_address: "Building Site, Akasia",
        item_description: "Clay bricks - 800kg",
        delivery_fee: 450.0,
        status: "pending",
        created_at: "2023-05-20T07:45:00Z",
      },
      {
        id: "5",
        tracking_code: "VAN567890",
        pickup_address: "Timber Merchant, Wonderboom",
        delivery_address: "Home, Mabopane",
        item_description: "Wooden planks - 75kg",
        delivery_fee: 195.0,
        status: "cancelled",
        created_at: "2023-05-12T11:20:00Z",
      },
    ]

    // Try to load from database if user is authenticated
    const userData = localStorage.getItem("vangoUser")
    if (userData) {
      const user = JSON.parse(userData)
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        setDeliveries(data)
      } else {
        setDeliveries(sampleDeliveries)
      }
    } else {
      setDeliveries(sampleDeliveries)
    }

    setIsLoading(false)
  }

  const filterDeliveries = () => {
    let filtered = [...deliveries]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((delivery) => delivery.status === statusFilter)
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (timeFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7)
          break
        case "30days":
          filterDate.setDate(now.getDate() - 30)
          break
        case "90days":
          filterDate.setDate(now.getDate() - 90)
          break
      }

      if (timeFilter !== "all") {
        filtered = filtered.filter((delivery) => new Date(delivery.created_at) >= filterDate)
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.item_description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDeliveries(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "in_transit":
        return "bg-orange-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered"
      case "in_transit":
        return "In Transit"
      case "pending":
        return "Pending"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  const handleRateDelivery = (deliveryId: string, rating: number) => {
    toast({
      title: "Rating Submitted",
      description: `Thank you for rating this delivery ${rating} stars!`,
    })
  }

  const handleViewDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
  }

  const exportDeliveries = () => {
    toast({
      title: "Export Started",
      description: "Your delivery history is being prepared for download.",
    })
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Delivery History</h2>
        <Button
          onClick={exportDeliveries}
          variant="outline"
          className="border-orange-500 text-orange-500 hover:bg-orange-500/10 bg-transparent"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tracking code, address, or item..."
              className="bg-slate-700 border-slate-600 text-white pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{deliveries.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {deliveries.filter((d) => d.status === "delivered").length}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              R {deliveries.reduce((sum, d) => sum + d.delivery_fee, 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">Total Spent</div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading delivery history...</p>
          </div>
        ) : filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{delivery.tracking_code}</h3>
                    <p className="text-sm text-gray-400">{delivery.item_description}</p>
                  </div>
                  <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                    {getStatusText(delivery.status)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">From:</p>
                      <p className="text-sm text-white">{delivery.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">To:</p>
                      <p className="text-sm text-white">{delivery.delivery_address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(delivery.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-white">R {delivery.delivery_fee.toFixed(2)}</p>
                </div>

                {delivery.driver_name && (
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-gray-400">Driver: {delivery.driver_name}</span>
                    {delivery.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-white">{delivery.rating}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewDetails(delivery)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {delivery.status === "delivered" && !delivery.rating && (
                    <Button
                      onClick={() => handleRateDelivery(delivery.id, 5)}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No deliveries found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || statusFilter !== "all" || timeFilter !== "all"
                ? "Try adjusting your filters"
                : "Your delivery history will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* Selected Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                Delivery Details
                <Button
                  onClick={() => setSelectedDelivery(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">{selectedDelivery.tracking_code}</h3>
                <Badge className={`${getStatusColor(selectedDelivery.status)} text-white`}>
                  {getStatusText(selectedDelivery.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Item Description:</p>
                  <p className="text-white">{selectedDelivery.item_description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pickup Address:</p>
                  <p className="text-white">{selectedDelivery.pickup_address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Delivery Address:</p>
                  <p className="text-white">{selectedDelivery.delivery_address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Delivery Fee:</p>
                  <p className="text-white font-semibold">R {selectedDelivery.delivery_fee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Order Date:</p>
                  <p className="text-white">{new Date(selectedDelivery.created_at).toLocaleString()}</p>
                </div>
                {selectedDelivery.completed_at && (
                  <div>
                    <p className="text-sm text-gray-400">Completed Date:</p>
                    <p className="text-white">{new Date(selectedDelivery.completed_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedDelivery.driver_name && (
                  <div>
                    <p className="text-sm text-gray-400">Driver:</p>
                    <p className="text-white">{selectedDelivery.driver_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
