import React from 'react'
import { Box } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { AdminDashboardV2 } from '@/components/dashboards/AdminDashboardV2'
import { ManagerDashboardV2 } from '@/components/dashboards/ManagerDashboardV2'
import { EmployeeDashboardV2 } from '@/components/dashboards/EmployeeDashboardV2'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <Box>
      {user?.role === 'admin' && <AdminDashboardV2 />}
      {user?.role === 'manager' && <ManagerDashboardV2 />}
      {user?.role === 'employee' && <EmployeeDashboardV2 />}
    </Box>
  )
}
