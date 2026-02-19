"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Persist state to localStorage with SSR safety.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage("theme", "dark")
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}"`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.warn(`useLocalStorage: error writing key "${key}"`, error)
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`useLocalStorage: error removing key "${key}"`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, { removeValue, isLoaded }] as const
}