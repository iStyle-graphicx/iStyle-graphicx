import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default async function Icon() {
  // Fetch the logo image
  const logoUrl = new URL("/vango-logo.jpg", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <img
        src={logoUrl.toString() || "/placeholder.svg"}
        alt="VanGo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>,
    {
      ...size,
    },
  )
}
