import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  Alert,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  School as SchoolIcon,
  MyLocation as TargetIcon,
  Edit as EditIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockEmployees, mockDevelopmentPlans, mockTrainingRecords } from '@/api/mockData'
import { StatsCard } from '@/components/analytics/StatsCard'
import { EmployeeCard } from '@/components/dashboard/EmployeeCard'
import { SectionHeader } from '@/components/dashboard/SectionHeader'

// Mock team data - in real app, would filter by manager
const getManagerTeam = () => mockEmployees.slice(0, 3)
const getTeamReviews = () => mockPerformanceReviews.slice(0, 2)

export const ManagerDashboardV2: React.FC = () => {
  const navigate = useNavigate()
  const team = getManagerTeam()
  const teamReviews = getTeamReviews()

  // Calculate metrics
  const teamSize = team.length
  const activeTeamMembers = team.filter((e) => e.status === 'active').length
  const teamAverageRating = (teamReviews.reduce((sum, r) => sum + r.rating, 0) / teamReviews.length).toFixed(2)
  const pendingReviews = teamReviews.filter((r) => r.status !== 'approved').length
  const teamTrainings = mockTrainingRecords.filter((t) =>
    team.map((m) => m.id).includes(t.employeeId)
  )
  const completedTeamTrainings = teamTrainings.filter((t) => t.status === 'completed').length
  const teamGoals = mockDevelopmentPlans
    .filter((p) => team.map((m) => m.id).includes(p.employeeId))
    .reduce((sum, plan) => sum + plan.goals.length, 0)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            mb: 1,
          }}
        >
          Team Dashboard
        </Typography>
        <Typography sx={{ color: 'var(--color-text-muted)' }}>
          Manage and monitor your team's performance and development
        </Typography>
      </Box>

      {/* Alert for pending actions */}
      {pendingReviews > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{
            mb: 3,
            backgroundColor: 'var(--color-warning-50)',
            color: 'var(--color-warning)',
            border: '1px solid var(--color-warning)',
          }}
        >
          You have <strong>{pendingReviews} pending review(s)</strong> that need your attention.
        </Alert>
      )}

      {/* Team Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Team Size"
            value={teamSize}
            icon={<PeopleIcon />}
            color="#0D9488"
            subtext={`${activeTeamMembers} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Team Performance"
            value={teamAverageRating}
            unit="/5.0"
            icon={<TrendingUpIcon />}
            color="#7C3AED"
            trend={parseFloat(teamAverageRating) > 4 ? 5 : -2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Review Status"
            value={(((teamReviews.length - pendingReviews) / teamReviews.length) * 100).toFixed(0)}
            unit="%"
            icon={<CheckCircleIcon />}
            color="#059669"
            progress={((teamReviews.length - pendingReviews) / teamReviews.length) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Development Goals"
            value={teamGoals}
            icon={<TargetIcon />}
            color="#2563EB"
            subtext="Active goals across team"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Team Members */}
        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              height: '100%',
            }}
          >
            <Box sx={{ p: 3 }}>
              <SectionHeader
                title="Your Team"
                subtitle={`${teamSize} direct reports`}
                icon={<PeopleIcon />}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {team.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onView={() => navigate(`/employee/${employee.id}`)}
                    onEdit={() => navigate(`/employee/${employee.id}/edit`)}
                    showStats
                    isEditable
                  />
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Quick Actions Panel */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Team Development Plans */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Development Goals"
                  subtitle={`${teamGoals} active goals`}
                  icon={<TargetIcon />}
                  actionLabel="Create Plan"
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {mockDevelopmentPlans.slice(0, 2).map((plan) => (
                    <Box
                      key={plan.id}
                      sx={{
                        p: 2,
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: 'var(--color-primary)',
                          backgroundColor: 'var(--color-primary-50)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {plan.employeeName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                            {plan.title}
                          </Typography>
                        </Box>
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            backgroundColor: 'var(--color-success-50)',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      {plan.goals[0] && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {plan.goals[0].title}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {plan.goals[0].progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={plan.goals[0].progress}
                            sx={{
                              height: 5,
                              borderRadius: '3px',
                              backgroundColor: 'var(--color-border)',
                              '& .MuiLinearProgress-bar': {
                                background: 'var(--gradient-secondary)',
                              },
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Training Management */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Team Training"
                  subtitle={`${completedTeamTrainings} completed`}
                  icon={<SchoolIcon />}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {teamTrainings.slice(0, 3).map((training) => (
                    <Box
                      key={training.id}
                      sx={{
                        p: 1.5,
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {training.courseTitle}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
                            {training.employeeName}
                          </Typography>
                        </Box>
                        <Chip
                          label={training.status === 'completed' ? 'Done' : 'In Progress'}
                          size="small"
                          sx={{
                            backgroundColor:
                              training.status === 'completed' ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                            color:
                              training.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Team Reviews Table */}
      <Card
        sx={{
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          mt: 4,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3 }}>
          <SectionHeader
            title="Team Performance Reviews"
            subtitle={`${teamReviews.length} reviews`}
            icon={<CheckCircleIcon />}
            actionLabel="Create Review"
            onAction={() => navigate('/reviews/new')}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamReviews.map((review) => (
                  <TableRow
                    key={review.id}
                    sx={{
                      borderBottom: '1px solid var(--color-border)',
                      '&:hover': { backgroundColor: 'var(--color-bg-secondary)' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {review.employeeName}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--color-text-secondary)' }}>{review.period}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor:
                              review.rating >= 4.5
                                ? 'var(--color-success)'
                                : review.rating >= 3.5
                                ? 'var(--color-primary)'
                                : 'var(--color-warning)',
                          }}
                        />
                        <Typography sx={{ fontWeight: 600 }}>{review.rating.toFixed(1)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor:
                            review.status === 'approved'
                              ? 'var(--color-success-50)'
                              : review.status === 'submitted'
                              ? 'var(--color-info-50)'
                              : 'var(--color-warning-50)',
                          color:
                            review.status === 'approved'
                              ? 'var(--color-success)'
                              : review.status === 'submitted'
                              ? 'var(--color-info)'
                              : 'var(--color-warning)',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<EditIcon sx={{ fontSize: '16px' }} />}
                        onClick={() => navigate(`/reviews/${review.id}`)}
                        sx={{
                          color: 'var(--color-primary)',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: 'var(--color-primary-50)' },
                        }}
                      >
                        {review.status === 'draft' ? 'Continue' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    </Box>
  )
}
