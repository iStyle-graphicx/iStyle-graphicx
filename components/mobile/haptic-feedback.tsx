"use client"

export class HapticFeedback {
  private static isSupported = typeof navigator !== "undefined" && "vibrate" in navigator

  static light() {
    if (this.isSupported) {
      navigator.vibrate(10)
    }
  }

  static medium() {
    if (this.isSupported) {
      navigator.vibrate(30)
    }
  }

  static heavy() {
    if (this.isSupported) {
      navigator.vibrate(50)
    }
  }

  static success() {
    if (this.isSupported) {
      navigator.vibrate([30, 10, 30])
    }
  }

  static error() {
    if (this.isSupported) {
      navigator.vibrate([50, 30, 50, 30, 50])
    }
  }

  static notification() {
    if (this.isSupported) {
      navigator.vibrate([20, 10, 20])
    }
  }

  static selection() {
    if (this.isSupported) {
      navigator.vibrate(5)
    }
  }
}

// Hook for using haptic feedback
export function useHapticFeedback() {
  return {
    light: HapticFeedback.light,
    medium: HapticFeedback.medium,
    heavy: HapticFeedback.heavy,
    success: HapticFeedback.success,
    error: HapticFeedback.error,
    notification: HapticFeedback.notification,
    selection: HapticFeedback.selection,
  }
}
