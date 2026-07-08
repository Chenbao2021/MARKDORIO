import { useCallback, useState } from 'react'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage indisponible ou quota dépassé — on ignore, l'état en mémoire reste correct
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON(key, initialValue))

  const setStoredValue = useCallback(
    (next: T) => {
      setValue(next)
      writeJSON(key, next)
    },
    [key],
  )

  return [value, setStoredValue]
}
