"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DeliverySchedulerProps {
  onScheduled?: (scheduledDate: Date) => void
  deliveryData?: any
}

export function DeliveryScheduler({ onScheduled, deliveryData }: DeliverySchedulerProps) {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>("")
  const [isScheduling, setIsScheduling] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  const handleSchedule = async () => {
    if (!date || !time) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time",
        variant: "destructive",
      })
      return
    }

    setIsScheduling(true)

    try {
      const [hours, minutes] = time.split(":")
      const scheduledDateTime = new Date(date)
      scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "Invalid Time",
          description: "Please select a future date and time",
          variant: "destructive",
        })
        setIsScheduling(false)
        return
      }

      if (deliveryData) {
        // Update existing delivery with scheduled time
        const { error } = await supabase
          .from("deliveries")
          .update({
            scheduled_pickup: scheduledDateTime.toISOString(),
            status: "scheduled",
          })
          .eq("id", deliveryData.id)

        if (error) throw error
      }

      toast({
        title: "Delivery Scheduled",
        description: `Pickup scheduled for ${format(scheduledDateTime, "PPP 'at' p")}`,
      })

      onScheduled?.(scheduledDateTime)
    } catch (error) {
      console.error("Error scheduling delivery:", error)
      toast({
        title: "Error",
        description: "Failed to schedule delivery. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-orange-500" />
          Schedule Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Select Time</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="border-white/20 text-white bg-slate-700">
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot} className="text-white">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {slot}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSchedule}
          disabled={isScheduling || !date || !time}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isScheduling ? "Scheduling..." : "Schedule Delivery"}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Scheduled deliveries can be modified up to 2 hours before pickup time
        </p>
      </CardContent>
    </Card>
  )
}
