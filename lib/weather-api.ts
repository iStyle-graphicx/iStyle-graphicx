export interface WeatherData {
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  location: string
}

export async function getWeatherData(): Promise<WeatherData> {
  try {
    const response = await fetch("/api/weather", {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Weather API route failed with status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Failed to fetch weather data from API route:", error)
    // Return fallback data
    return {
      temperature: 25,
      condition: "partly cloudy",
      icon: "⛅",
      humidity: 60,
      windSpeed: 15,
      location: "Pretoria",
    }
  }
}
