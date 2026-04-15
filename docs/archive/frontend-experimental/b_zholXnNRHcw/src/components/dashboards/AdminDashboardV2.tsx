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
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  School as SchoolIcon,
  MyLocation as TargetIcon,
  BarChart as BarChartIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockEmployees, mockDevelopmentPlans, mockTrainingRecords } from '@/api/mockData'
import { StatsCard } from '@/components/analytics/StatsCard'
import { EmployeeCard } from '@/components/dashboard/EmployeeCard'
import { SectionHeader } from '@/components/dashboard/SectionHeader'
import PerformanceChart from '@/components/charts/PerformanceChart'

export const AdminDashboardV2: React.FC = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  // Calculate metrics
  const totalEmployees = mockEmployees.length
  const activeEmployees = mockEmployees.filter((e) => e.status === 'active').length
  const averageRating = (mockPerformanceReviews.reduce((sum, r) => sum + r.rating, 0) / mockPerformanceReviews.length).toFixed(2)
  const pendingReviews = mockPerformanceReviews.filter((r) => r.status !== 'approved').length
  const completedTrainings = mockTrainingRecords.filter((t) => t.status === 'completed').length
  const activeGoals = mockDevelopmentPlans.reduce((sum, plan) => sum + plan.goals.length, 0)

  // Chart data
  const performanceTrendData = [
    { month: 'Jan', rating: 3.8, participation: 70 },
    { month: 'Feb', rating: 4.0, participation: 75 },
    { month: 'Mar', rating: 4.1, participation: 82 },
    { month: 'Apr', rating: 4.23, participation: 85 },
  ]

  const departmentPerformance = [
    { name: 'Engineering', value: 4.3 },
    { name: 'Product', value: 4.1 },
    { name: 'Design', value: 4.0 },
    { name: 'Marketing', value: 3.9 },
  ]

  const skillsData = [
    { subject: 'Technical', A: 4.2, fullMark: 5 },
    { subject: 'Leadership', A: 3.9, fullMark: 5 },
    { subject: 'Communication', A: 4.1, fullMark: 5 },
    { subject: 'Problem Solving', A: 4.3, fullMark: 5 },
    { subject: 'Teamwork', A: 4.0, fullMark: 5 },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#00D9D9' }}>
          Organization Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#B8C5D6' }}>
          Complete organizational overview and performance metrics
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Employees"
            value={totalEmployees}
            icon={<PeopleIcon />}
            color="#00D9D9"
            subtext={`${activeEmployees} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Avg Performance"
            value={averageRating}
            unit="/5.0"
            icon={<BarChartIcon />}
            color="#0066FF"
            trend={parseFloat(averageRating) > 4 ? 5 : -2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Review Completion"
            value={(((mockPerformanceReviews.length - pendingReviews) / mockPerformanceReviews.length) * 100).toFixed(0)}
            unit="%"
            icon={<CheckCircleIcon />}
            color="#00D97E"
            progress={((mockPerformanceReviews.length - pendingReviews) / mockPerformanceReviews.length) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Items"
            value={pendingReviews}
            icon={<PendingIcon />}
            color="#FF8A00"
            subtext="Reviews awaiting action"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Employee Management Section */}
        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              border: '1px solid #3A4556',
              borderRadius: '12px',
              height: '100%',
              backgroundColor: '#1E2633',
            }}
          >
            <Box sx={{ p: 3 }}>
              <SectionHeader
                title="Employee Directory"
                subtitle={`${totalEmployees} team members`}
                icon={<PeopleIcon />}
                actionLabel="Add Employee"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {mockEmployees.map((employee) => (
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

        {/* Analytics Panel */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Development Plans */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Development Plans"
                  subtitle={`${mockDevelopmentPlans.length} active plans`}
                  icon={<TargetIcon />}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {mockDevelopmentPlans.map((plan) => (
                    <Box
                      key={plan.id}
                      sx={{
                        p: 2,
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
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
                                background: 'var(--gradient-accent)',
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

            {/* Training Overview */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Training Overview"
                  subtitle={`${completedTrainings} completed`}
                  icon={<SchoolIcon />}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Completed Trainings
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {completedTrainings}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(completedTrainings / mockTrainingRecords.length) * 100}
                    sx={{
                      height: 8,
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-border)',
                      '& .MuiLinearProgress-bar': {
                        background: 'var(--gradient-primary)',
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Active Goals
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                      {activeGoals}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Performance Reviews Table */}
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
            title="Recent Performance Reviews"
            subtitle={`${mockPerformanceReviews.length} total reviews`}
            icon={<BarChartIcon />}
            actionLabel="Create Review"
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Reviewer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPerformanceReviews.map((review) => (
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
                    <TableCell sx={{ color: 'var(--color-text-secondary)' }}>{review.reviewer}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate(`/reviews/${review.id}`)}
                        sx={{
                          color: 'var(--color-primary)',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: 'var(--color-primary-50)' },
                        }}
                      >
                        View
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
