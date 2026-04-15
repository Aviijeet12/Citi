import React from 'react'
import {
  Box,
  Card,
  Grid,
  Typography,
  Avatar,
  Chip,
  Divider,
  Button,
  Alert,
} from '@mui/material'
import {
  Edit as EditIcon,
  Lock as LockIcon,
  Mail as MailIcon,
  Business as BuildingIcon,
  Work as BriefcaseIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material'
import { Employee } from '@/types'
import { getEditLevel, EditLevel } from '@/utils/rolePermissions'

interface EmployeeProfileProps {
  employee: Employee
  isEditable: boolean
  currentUserId?: string
  userRole?: string
  onEdit?: () => void
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  isEditable,
  currentUserId,
  userRole = 'employee',
  onEdit,
}) => {
  const editLevel = getEditLevel(userRole as any, employee.id, currentUserId)
  const isReadOnly = editLevel === 'readonly' || editLevel === 'none'

  const statusColor =
    employee.status === 'active'
      ? 'var(--color-success)'
      : employee.status === 'on-leave'
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)'

  const statusBgColor =
    employee.status === 'active'
      ? 'var(--color-success-50)'
      : employee.status === 'on-leave'
      ? 'var(--color-warning-50)'
      : 'var(--color-border)'

  return (
    <Box>
      {isReadOnly && (
        <Alert
          severity="info"
          icon={<LockIcon />}
          sx={{
            mb: 3,
            backgroundColor: 'var(--color-info-50)',
            color: 'var(--color-info)',
            border: '1px solid var(--color-info)',
          }}
        >
          This employee's information is read-only. Only managers and administrators can make changes.
        </Alert>
      )}

      {/* Main Profile Card */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                background: 'var(--gradient-primary)',
                height: '80px',
              }}
            />

            <Box sx={{ p: 3, textAlign: 'center', mt: -4, position: 'relative', zIndex: 1 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: 'var(--gradient-secondary)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {employee.name.charAt(0)}
              </Avatar>

              <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {employee.name}
              </Typography>

              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 2 }}>
                {employee.jobTitle}
              </Typography>

              <Chip
                label={employee.status === 'active' ? 'Active' : employee.status}
                sx={{
                  backgroundColor: statusBgColor,
                  color: statusColor,
                  fontWeight: 600,
                  mb: 2,
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <MailIcon sx={{ fontSize: '18px', color: 'var(--color-primary)' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employee.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <BuildingIcon sx={{ fontSize: '18px', color: 'var(--color-secondary)' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                      Department
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employee.department}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <GroupIcon sx={{ fontSize: '18px', color: 'var(--color-tertiary)' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                      Manager
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employee.manager}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRangeIcon sx={{ fontSize: '18px', color: 'var(--color-success)' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                      Hire Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(employee.hireDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {!isReadOnly && onEdit && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                  fullWidth
                  sx={{
                    mt: 3,
                    background: 'var(--gradient-primary)',
                    textTransform: 'none',
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Details Section */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Profile Information
                </Typography>
                {isReadOnly && (
                  <Chip
                    icon={<LockIcon />}
                    label="Read-Only"
                    size="small"
                    sx={{
                      backgroundColor: 'var(--color-info-50)',
                      color: 'var(--color-info)',
                    }}
                  />
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      FULL NAME
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {employee.name}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      JOB TITLE
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {employee.jobTitle}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      DEPARTMENT
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {employee.department}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      EMPLOYMENT STATUS
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={employee.status}
                        size="small"
                        sx={{
                          backgroundColor: statusBgColor,
                          color: statusColor,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      EMAIL
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {employee.email}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      MANAGER
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {employee.manager}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      HIRE DATE
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {new Date(employee.hireDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
