import { useCallback, useEffect, useRef } from 'react'

interface DebouncedCallback<Args extends unknown[]> {
  call: (...args: Args) => void
  flush: () => void
}

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgsRef = useRef<Args | null>(null)

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingArgsRef.current) {
      callbackRef.current(...pendingArgsRef.current)
      pendingArgsRef.current = null
    }
  }, [])

  const call = useCallback(
    (...args: Args) => {
      pendingArgsRef.current = args
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, delay)
    },
    [delay, flush],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { call, flush }
}
