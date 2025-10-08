"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AppLoader from "@/components/app-loader"

export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Check if user has already loaded the app in this session
    const hasLoaded = sessionStorage.getItem("vango-loaded")
    if (hasLoaded) {
      setIsLoading(false)
      setShowContent(true)
    }
  }, [])

  const handleLoadComplete = () => {
    sessionStorage.setItem("vango-loaded", "true")
    setIsLoading(false)
    setTimeout(() => {
      setShowContent(true)
    }, 100)
  }

  return (
    <>
      {isLoading && <AppLoader onLoadComplete={handleLoadComplete} />}
      <div
        className={`transition-opacity duration-300 ${showContent ? "opacity-100" : "opacity-0"}`}
        style={{ display: showContent ? "block" : "none" }}
      >
        {children}
      </div>
    </>
  )
}
