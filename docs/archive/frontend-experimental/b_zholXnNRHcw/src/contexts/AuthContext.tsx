import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { 
  authenticateWithCredentials, 
  authenticateWithGoogle, 
  authenticateWithGitHub,
  fetchCurrentUser,
  logoutUser,
  validateToken 
} from '@/utils/authUtils'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (googleToken: string) => Promise<void>
  loginWithGitHub: (githubToken: string) => Promise<void>
  logout: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('authUser')

    const initializeSession = async () => {
      if (savedToken && savedUser && validateToken(savedToken)) {
        try {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
          const currentUser = await fetchCurrentUser()
          setUser(currentUser)
          localStorage.setItem('authUser', JSON.stringify(currentUser))
        } catch {
          localStorage.removeItem('authToken')
          localStorage.removeItem('authUser')
          localStorage.removeItem('refreshToken')
          setToken(null)
          setUser(null)
        }
      } else {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
      }
      setIsLoading(false)
    }

    void initializeSession()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authenticateWithCredentials(email, password)
      if (!result) {
        throw new Error('Invalid email or password')
      }

      setUser(result.user)
      setToken(result.token)
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('authUser', JSON.stringify(result.user))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (googleToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authenticateWithGoogle(googleToken)
      if (!result) {
        throw new Error('Google authentication failed')
      }

      setUser(result.user)
      setToken(result.token)
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('authUser', JSON.stringify(result.user))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGitHub = async (githubToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authenticateWithGitHub(githubToken)
      if (!result) {
        throw new Error('GitHub authentication failed')
      }

      setUser(result.user)
      setToken(result.token)
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('authUser', JSON.stringify(result.user))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    void logoutUser()
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('refreshToken')
  }

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        isLoading, 
        error, 
        login, 
        loginWithGoogle, 
        loginWithGitHub,
        logout, 
        hasRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
