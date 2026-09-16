import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { credentials } = useAuth()

  if (!credentials) {
    return <Navigate to="/login" replace />
  }

  return children
}
