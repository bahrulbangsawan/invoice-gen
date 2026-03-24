import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "openrouter-api-key"

function getSnapshot(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(STORAGE_KEY) ?? ""
}

function getServerSnapshot(): string {
  return ""
}

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function notify() {
  for (const listener of listeners) listener()
}

export function useApiKey() {
  const apiKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key)
    notify()
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    notify()
  }, [])

  return { apiKey, setApiKey, clearApiKey }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••"
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}
