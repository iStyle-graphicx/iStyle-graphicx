"use client"

import { useState, useCallback } from "react"

export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const updateOptimistically = useCallback(
    async (optimisticValue: T, asyncUpdate: () => Promise<T>) => {
      const previousData = data
      setData(optimisticValue)
      setIsOptimistic(true)

      try {
        const result = await asyncUpdate()
        setData(result)
        setIsOptimistic(false)
        return result
      } catch (error) {
        setData(previousData)
        setIsOptimistic(false)
        throw error
      }
    },
    [data],
  )

  return { data, isOptimistic, updateOptimistically, setData }
}
