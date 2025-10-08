"use client"

import { Button } from "@/components/ui/button"

export function SkipLinks() {
  const skipToMain = () => {
    const main = document.querySelector("main")
    if (main) {
      main.focus()
      main.scrollIntoView()
    }
  }

  const skipToNav = () => {
    const nav = document.querySelector("nav")
    if (nav) {
      nav.focus()
      nav.scrollIntoView()
    }
  }

  return (
    <div className="skip-links">
      <Button
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-orange-500 hover:bg-orange-600"
        tabIndex={1}
      >
        Skip to main content
      </Button>
      <Button
        onClick={skipToNav}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 bg-orange-500 hover:bg-orange-600"
        tabIndex={2}
      >
        Skip to navigation
      </Button>
    </div>
  )
}
