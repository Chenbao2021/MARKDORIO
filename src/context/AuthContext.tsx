import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const NOT_CONFIGURED_ERROR = "La connexion Google n'est pas configurée pour cette app"

interface AuthContextValue {
  user: User | null
  isAuthLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) throw new Error(NOT_CONFIGURED_ERROR)
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signOutUser = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthLoading, signInWithGoogle, signOutUser }),
    [user, isAuthLoading, signInWithGoogle, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
