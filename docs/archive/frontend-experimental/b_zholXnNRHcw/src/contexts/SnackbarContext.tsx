import React, { createContext, useContext, useState } from 'react'

type Severity = 'success' | 'error' | 'warning' | 'info'

interface SnackbarMessage {
  message: string
  severity: Severity
  id: string
}

interface SnackbarContextType {
  messages: SnackbarMessage[]
  showSnackbar: (message: string, severity?: Severity, duration?: number) => void
  removeSnackbar: (id: string) => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<SnackbarMessage[]>([])

  const showSnackbar = (message: string, severity: Severity = 'info', duration: number = 4000) => {
    const id = Date.now().toString()
    const newMessage: SnackbarMessage = { message, severity, id }

    setMessages((prev) => [...prev, newMessage])

    if (duration > 0) {
      setTimeout(() => removeSnackbar(id), duration)
    }
  }

  const removeSnackbar = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  return (
    <SnackbarContext.Provider value={{ messages, showSnackbar, removeSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  )
}

export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}
