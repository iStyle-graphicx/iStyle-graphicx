"use client"

import { useEffect, useCallback } from "react"
import { useAccessibility } from "@/components/accessibility/accessibility-provider"

export function useKeyboardNavigation() {
  const { settings, announceToScreenReader } = useAccessibility()

  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!settings.keyboardNavigation) return

      // Handle common keyboard shortcuts
      switch (event.key) {
        case "Escape":
          // Close modals, dropdowns, etc.
          const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]')
          if (activeModal) {
            const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]')
            if (closeButton instanceof HTMLElement) {
              closeButton.click()
            }
          }
          break

        case "Enter":
        case " ":
          // Activate buttons and links
          const target = event.target as HTMLElement
          if (target.getAttribute("role") === "button" && !target.hasAttribute("disabled")) {
            event.preventDefault()
            target.click()
          }
          break

        case "ArrowDown":
        case "ArrowUp":
          // Navigate through menu items or lists
          const currentElement = event.target as HTMLElement
          if (currentElement.getAttribute("role") === "menuitem" || currentElement.closest('[role="menu"]')) {
            event.preventDefault()
            const menuItems = Array.from(
              document.querySelectorAll('[role="menuitem"]:not([disabled])'),
            ) as HTMLElement[]
            const currentIndex = menuItems.indexOf(currentElement)

            if (event.key === "ArrowDown") {
              const nextIndex = (currentIndex + 1) % menuItems.length
              menuItems[nextIndex]?.focus()
            } else {
              const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1
              menuItems[prevIndex]?.focus()
            }
          }
          break

        case "Home":
        case "End":
          // Navigate to first/last item in lists
          const listElement = (event.target as HTMLElement).closest('[role="list"], [role="menu"]')
          if (listElement) {
            event.preventDefault()
            const items = Array.from(
              listElement.querySelectorAll('[role="listitem"], [role="menuitem"]'),
            ) as HTMLElement[]

            if (event.key === "Home") {
              items[0]?.focus()
            } else {
              items[items.length - 1]?.focus()
            }
          }
          break
      }
    },
    [settings.keyboardNavigation],
  )

  useEffect(() => {
    if (settings.keyboardNavigation) {
      document.addEventListener("keydown", handleKeyboardNavigation)
      return () => document.removeEventListener("keydown", handleKeyboardNavigation)
    }
  }, [handleKeyboardNavigation, settings.keyboardNavigation])

  const announceNavigation = useCallback(
    (message: string) => {
      if (settings.screenReader) {
        announceToScreenReader(message)
      }
    },
    [settings.screenReader, announceToScreenReader],
  )

  return {
    announceNavigation,
  }
}
