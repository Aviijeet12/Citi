import { User, AuthProvider } from '@/types'
import {
  loadCurrentUser,
  loginWithCredentials,
  logoutFromBackend,
} from '@/api/backend'

export const authenticateWithCredentials = async (
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> => {
  return loginWithCredentials(email, password)
}

export const authenticateWithGoogle = async (): Promise<{ user: User; token: string } | null> => {
  throw new Error('Google authentication is not configured for this backend yet')
}

export const authenticateWithGitHub = async (): Promise<{ user: User; token: string } | null> => {
  throw new Error('GitHub authentication is not configured for this backend yet')
}

export const validateToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    const now = Math.floor(Date.now() / 1000)
    return typeof payload.exp === 'number' && payload.exp > now
  } catch {
    return false
  }
}

export const decodeToken = (token: string): { userId: string; provider: AuthProvider } | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return {
      userId: payload.sub,
      provider: 'credentials',
    }
  } catch {
    return null
  }
}

export const fetchCurrentUser = async () => {
  return loadCurrentUser()
}

export const logoutUser = async () => {
  await logoutFromBackend()
}

