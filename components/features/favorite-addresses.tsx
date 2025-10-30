"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Plus, Trash2, Home, Briefcase, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface FavoriteAddress {
  id: string
  label: string
  address: string
  latitude?: number
  longitude?: number
}

interface FavoriteAddressesProps {
  userId: string
  onSelectAddress?: (address: FavoriteAddress) => void
}

export function FavoriteAddresses({ userId, onSelectAddress }: FavoriteAddressesProps) {
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchFavorites()
  }, [userId])

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorite_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addFavorite = async () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both label and address",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("favorite_addresses")
        .insert({
          user_id: userId,
          label: newLabel,
          address: newAddress,
        })
        .select()
        .single()

      if (error) throw error

      setFavorites([data, ...favorites])
      setNewLabel("")
      setNewAddress("")
      setIsAdding(false)

      toast({
        title: "Address Saved",
        description: "Favorite address added successfully",
      })
    } catch (error) {
      console.error("Error adding favorite:", error)
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase.from("favorite_addresses").delete().eq("id", id)

      if (error) throw error

      setFavorites(favorites.filter((f) => f.id !== id))
      toast({
        title: "Address Removed",
        description: "Favorite address deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting favorite:", error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getIcon = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes("home")) return <Home className="w-4 h-4" />
    if (lowerLabel.includes("work") || lowerLabel.includes("office")) return <Briefcase className="w-4 h-4" />
    return <Star className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-orange-500" />
            Favorite Addresses
          </CardTitle>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Address Form */}
        {isAdding && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Label</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Home, Work, Warehouse"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Address</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter full address"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addFavorite} className="flex-1 bg-orange-500 hover:bg-orange-600">
                Save Address
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false)
                  setNewLabel("")
                  setNewAddress("")
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Favorite Addresses List */}
        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => onSelectAddress?.(favorite)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-orange-500/20 rounded-lg">{getIcon(favorite.label)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{favorite.label}</p>
                        <Badge variant="secondary" className="text-xs">
                          Favorite
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{favorite.address}</p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFavorite(favorite.id)
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No favorite addresses yet</p>
            <p className="text-sm text-gray-500 mt-1">Add frequently used addresses for quick access</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
