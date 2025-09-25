"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { getWeatherData, type WeatherData } from "@/lib/weather-api"

interface HeaderProps {
  onMenuToggle: () => void
  user: any
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 25,
    condition: "loading...",
    icon: "🌤️",
    humidity: 60,
    windSpeed: 15,
    location: "Pretoria",
  })
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    // Fetch weather data on component mount
    const fetchWeather = async () => {
      const weatherData = await getWeatherData()
      setWeather(weatherData)
    }

    fetchWeather()

    // Update weather every 10 minutes
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000)

    return () => clearInterval(weatherInterval)
  }, [])

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
      <h1 className="text-orange-500 font-bold text-xl">VanGo</h1>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="text-lg">{weather.icon}</span>
          <div className="flex flex-col">
            <span className="text-white font-medium">{weather.temperature}°C</span>
            <span className="text-gray-300 text-xs capitalize">{weather.condition}</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="relative text-white">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="sm" onClick={onMenuToggle} className="text-white">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  )
}
