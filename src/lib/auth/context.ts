import { createContext } from 'react'
import type { AuthCredentials } from './storage'

export interface AuthContextValue {
  credentials: AuthCredentials | null
  login: (credentials: AuthCredentials) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
