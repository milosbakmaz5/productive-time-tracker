import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_INVALIDATED_EVENT } from '../api/client'
import { AuthContext, type AuthContextValue } from './context'
import type { AuthCredentials } from './storage'
import { clearCredentials, loadCredentials, saveCredentials } from './storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(() => loadCredentials())

  useEffect(() => {
    function handleInvalidated() {
      setCredentials(null)
    }
    window.addEventListener(AUTH_INVALIDATED_EVENT, handleInvalidated)
    return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, handleInvalidated)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      credentials,
      login: (next) => {
        saveCredentials(next)
        setCredentials(next)
      },
      logout: () => {
        clearCredentials()
        setCredentials(null)
      },
    }),
    [credentials],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
