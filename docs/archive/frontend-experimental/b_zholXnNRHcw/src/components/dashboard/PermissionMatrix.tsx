import React from 'react'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Help as HelpIcon,
} from '@mui/icons-material'

interface Permission {
  name: string
  description: string
  admin: boolean
  manager: boolean
  employee: boolean
}

const permissions: Permission[] = [
  {
    name: 'View All Employees',
    description: 'Access to all employees in organization',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    name: 'View Team Members',
    description: 'Access to direct reports only',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'View Own Profile',
    description: 'Access to personal information',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    name: 'Edit Core Employee Data',
    description: 'Edit name, job title, department, hire date',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    name: 'Edit Team Member Data',
    description: 'Edit team member information (manager only)',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Create Performance Reviews',
    description: 'Create new performance reviews',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Edit Performance Reviews',
    description: 'Modify existing performance reviews',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'View Performance Reviews',
    description: 'View own or assigned reviews',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    name: 'Create Development Plans',
    description: 'Create new development plans',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Edit Development Plans',
    description: 'Modify existing development plans',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Update Goal Progress',
    description: 'Update own goal progress percentage',
    admin: true,
    manager: false,
    employee: true,
  },
  {
    name: 'View Competencies',
    description: 'View skill assessments',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    name: 'Assess Competencies',
    description: 'Create/update competency assessments',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Manage Training',
    description: 'Create and manage training records',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'View Training Records',
    description: 'View own or team training history',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    name: 'Access Organization Analytics',
    description: 'View organization-wide analytics',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    name: 'Access Team Analytics',
    description: 'View team-specific analytics',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    name: 'Manage Managers',
    description: 'Create/edit manager assignments',
    admin: true,
    manager: false,
    employee: false,
  },
]

interface PermissionBadgeProps {
  allowed: boolean
  description: string
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({ allowed, description }) => {
  return (
    <Tooltip title={description}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {allowed ? (
          <Chip
            icon={<CheckIcon />}
            label="Yes"
            size="small"
            sx={{
              backgroundColor: 'var(--color-success-50)',
              color: 'var(--color-success)',
              fontWeight: 600,
            }}
          />
        ) : (
          <Chip
            icon={<CloseIcon />}
            label="No"
            size="small"
            sx={{
              backgroundColor: 'var(--color-error-50)',
              color: 'var(--color-error)',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    </Tooltip>
  )
}

export const PermissionMatrix: React.FC = () => {
  return (
    <Card sx={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-text-primary)', mb: 1 }}>
            Role Permission Matrix
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            Complete overview of what each role can access and modify
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)', minWidth: 250 }}>
                  Permission
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      AD
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Admin
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: 'var(--gradient-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      MG
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Manager
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: 'var(--gradient-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      EM
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Employee
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((permission, index) => (
                <TableRow
                  key={permission.name}
                  sx={{
                    borderBottom: '1px solid var(--color-border)',
                    '&:hover': { backgroundColor: 'var(--color-bg-secondary)' },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {permission.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                        {permission.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <PermissionBadge allowed={permission.admin} description="Admin can perform this action" />
                  </TableCell>
                  <TableCell align="center">
                    <PermissionBadge allowed={permission.manager} description="Manager can perform this action" />
                  </TableCell>
                  <TableCell align="center">
                    <PermissionBadge allowed={permission.employee} description="Employee can perform this action" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Legend */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', mb: 0.5 }}>
              AD = Admin (HR Administrator)
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
              Full organization access. Can manage all employees and system settings.
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', mb: 0.5 }}>
              MG = Manager
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
              Team-level access. Can manage direct reports only.
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', mb: 0.5 }}>
              EM = Employee
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
              Personal access. Can view own data and update goals.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  )
}
