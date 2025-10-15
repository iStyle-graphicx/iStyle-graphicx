import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        borderRadius: "22.5%",
      }}
    >
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/VANGO%20LOGO%201-YjIELJfx5UvFswj903JJHfMxHR3nF2.jpg"
        alt="VanGo"
        style={{
          width: "85%",
          height: "85%",
          objectFit: "contain",
        }}
      />
    </div>,
    {
      ...size,
    },
  )
}
