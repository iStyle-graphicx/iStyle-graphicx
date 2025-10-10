"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { getWeatherData, type WeatherData } from "@/lib/weather-api"
import { NotificationBell } from "@/components/notification-bell"
import { VangoLogo } from "@/components/vango-logo"

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
    <header className="flex items-center justify-between px-4 py-3 vango-glass-dark border-b border-orange-500/20 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <VangoLogo size="md" variant="full" />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm vango-glass-card px-3 py-1 rounded-full">
          <span className="text-lg">{weather.icon}</span>
          <div className="flex flex-col">
            <span className="text-white font-medium">{weather.temperature}°C</span>
            <span className="text-gray-300 text-xs capitalize">{weather.condition}</span>
          </div>
        </div>

        {user && <NotificationBell userId={user.id} />}

        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="text-white hover:bg-orange-500/20 hover:text-orange-400"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  )
}
