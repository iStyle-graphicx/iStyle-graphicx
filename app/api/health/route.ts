import { NextResponse } from "next/server"
import { performHealthCheck } from "@/lib/deployment-health"

export async function GET() {
  try {
    const health = await performHealthCheck()

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
