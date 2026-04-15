import React from 'react'
import {
  Box,
  Card,
  Avatar,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Divider,
  Grid,
} from '@mui/material'
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as TrainingIcon,
  TrackChanges as GoalIcon,
} from '@mui/icons-material'
import { Employee } from '@/types'

interface EmployeeCardProps {
  employee: Employee
  onView?: () => void
  onEdit?: () => void
  showStats?: boolean
  isEditable?: boolean
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onView,
  onEdit,
  showStats = false,
  isEditable = false,
}) => {
  const statusColor =
    employee.status === 'active'
      ? 'var(--color-success)'
      : employee.status === 'on-leave'
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)'

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))`,
        backdropFilter: 'blur(20px)',
        border: '1px solid #00D9D910',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `
          0 2px 4px rgba(0, 0, 0, 0.4),
          0 4px 8px rgba(0, 0, 0, 0.3),
          0 8px 16px rgba(0, 0, 0, 0.2)
        `,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, #00D9D910 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&:hover': {
          boxShadow: `
            0 4px 8px rgba(0, 0, 0, 0.5),
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 16px 32px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(0, 217, 217, 0.3),
            0 0 40px rgba(0, 217, 217, 0.15)
          `,
          borderColor: '#00D9D9',
          transform: 'translateZ(20px) translateY(-6px) rotateX(3deg)',
        },
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(90deg, #00D9D9, #4FE5E5)',
          height: '4px',
          boxShadow: '0 4px 16px rgba(0, 217, 217, 0.3)',
        }}
      />

      <Box sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative', zIndex: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #00D9D9, #4FE5E5)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0F1419',
              boxShadow: `
                0 4px 8px rgba(0, 217, 217, 0.3),
                0 8px 16px rgba(0, 217, 217, 0.2)
              `,
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) translateZ(10px)',
                boxShadow: `
                  0 8px 16px rgba(0, 217, 217, 0.4),
                  0 16px 32px rgba(0, 217, 217, 0.3)
                `,
              },
            }}
          >
            {employee.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {employee.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
              {employee.jobTitle}
            </Typography>
            <Box sx={{ mt: 0.75, display: 'flex', gap: 1 }}>
              <Chip
                label={employee.status === 'active' ? 'Active' : employee.status}
                size="small"
                sx={{
                  backgroundColor: statusColor + '20',
                  color: statusColor,
                  fontWeight: 600,
                  height: '24px',
                }}
              />
              <Chip
                label={employee.department}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'var(--color-border)',
                  height: '24px',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block', mb: 0.5 }}>
              Manager
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {employee.manager}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block', mb: 0.5 }}>
              Hire Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {new Date(employee.hireDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          </Grid>
        </Grid>

        {/* Stats */}
        {showStats && (
          <>
            <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid var(--color-border)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: '18px', color: 'var(--color-primary)' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Performance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-border)',
                    '& .MuiLinearProgress-bar': {
                      background: 'var(--gradient-primary)',
                    },
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                  85%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ flex: 1, textAlign: 'center', py: 1 }}>
                <GoalIcon sx={{ fontSize: '20px', color: 'var(--color-secondary)' }} />
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mt: 0.5 }}>
                  3 Goals
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center', py: 1 }}>
                <TrainingIcon sx={{ fontSize: '20px', color: 'var(--color-tertiary)' }} />
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mt: 0.5 }}>
                  2 Courses
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {onView && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewIcon sx={{ fontSize: '18px' }} />}
              onClick={onView}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                '&:hover': {
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-50)',
                },
              }}
            >
              View
            </Button>
          )}
          {onEdit && isEditable && (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: '18px' }} />}
              onClick={onEdit}
              fullWidth
              sx={{
                background: 'var(--gradient-primary)',
                textTransform: 'none',
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  )
}
