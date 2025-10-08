"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Search,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Calendar,
  Star,
  RefreshCw,
} from "lucide-react"

interface Order {
  id: string
  pickup_address: string
  delivery_address: string
  item_description: string
  item_weight: string
  delivery_fee: number
  status: string
  priority: string
  created_at: string
  scheduled_date?: string
  scheduled_time?: string
  payment_status: string
  payment_method: string
  driver?: {
    first_name: string
    last_name: string
    rating: number
    vehicle_type: string
    phone: string
  }
}

interface OrderListProps {
  user: any
  onOrderSelect?: (order: Order) => void
}

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock, label: "Pending" },
  accepted: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle, label: "Accepted" },
  in_transit: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Truck, label: "In Transit" },
  delivered: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle, label: "Cancelled" },
}

const PRIORITY_CONFIG = {
  standard: { color: "text-gray-400", label: "Standard" },
  urgent: { color: "text-orange-400", label: "Urgent" },
  emergency: { color: "text-red-400", label: "Emergency" },
}

export function OrderList({ user, onOrderSelect }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchTerm, statusFilter, priorityFilter, sortBy])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          drivers(
            id,
            rating,
            vehicle_type,
            profiles!inner(first_name, last_name, phone)
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedOrders =
        data?.map((order) => ({
          ...order,
          driver: order.drivers
            ? {
                first_name: order.drivers.profiles.first_name,
                last_name: order.drivers.profiles.last_name,
                rating: order.drivers.rating,
                vehicle_type: order.drivers.vehicle_type,
                phone: order.drivers.profiles.phone,
              }
            : undefined,
        })) || []

      setOrders(formattedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((order) => order.priority === priorityFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "delivery_fee":
          return b.delivery_fee - a.delivery_fee
        case "status":
          return a.status.localeCompare(b.status)
        case "priority":
          return a.priority.localeCompare(b.priority)
        default:
          return 0
      }
    })

    setFilteredOrders(filtered)
  }

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    const Icon = config?.icon || Package
    return <Icon className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-16 space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-gray-400 text-sm">{orders.length} total orders</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white pl-10"
              placeholder="Search orders..."
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-3 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="delivery_fee">Price</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You haven't created any orders yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
            const priorityConfig = PRIORITY_CONFIG[order.priority as keyof typeof PRIORITY_CONFIG]

            return (
              <Card
                key={order.id}
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => onOrderSelect?.(order)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Package className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">#{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig?.color} variant="outline">
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{statusConfig?.label}</span>
                      </Badge>
                      <span className="text-orange-500 font-semibold">R{order.delivery_fee}</span>
                    </div>
                  </div>

                  {/* Item Description */}
                  <div className="mb-3">
                    <p className="text-white font-medium truncate">{order.item_description}</p>
                    <p className="text-sm text-gray-400">{order.item_weight}kg</p>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400">From:</span>
                      <span className="text-white truncate flex-1">{order.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400">To:</span>
                      <span className="text-white truncate flex-1">{order.delivery_address}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</span>
                      </div>
                      {order.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{formatDate(order.scheduled_date)}</span>
                        </div>
                      )}
                    </div>

                    {order.driver && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Truck className="w-3 h-3 text-white" />
                        </div>
                        <div className="text-xs">
                          <p className="text-white">
                            {order.driver.first_name} {order.driver.last_name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="w-2 h-2 text-yellow-500 fill-current" />
                            <span className="text-gray-400">{order.driver.rating}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
