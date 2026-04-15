import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { AuthProvider } from '@/contexts/AuthContext'
import { SnackbarProvider } from '@/contexts/SnackbarContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { SnackbarNotification } from '@/components/SnackbarNotification'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Reviews } from '@/pages/Reviews'
import { DevelopmentPlans } from '@/pages/DevelopmentPlans'
import { TrainingRecords } from '@/pages/TrainingRecords'
import { Competencies } from '@/pages/Competencies'
import { Search } from '@/pages/Search'
import { Settings } from '@/pages/Settings'
import { Unauthorized } from '@/pages/Unauthorized'
import { theme3D } from '@/theme/muiTheme3D'

export default function App() {
  return (
    <ThemeProvider theme={theme3D}>
      <AuthProvider>
        <SnackbarProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="plans" element={<DevelopmentPlans />} />
            <Route path="training" element={<TrainingRecords />} />
            <Route path="competencies" element={<Competencies />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <SnackbarNotification />
      </SnackbarProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
