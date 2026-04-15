import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  Typography,
  LinearProgress,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  BarChart as BarChartIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockEmployees, mockDevelopmentPlans } from '@/api/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { filterPerformanceReviews, filterDevelopmentPlans, getMetricsForRole } from '@/utils/dataFilters'
import { StatsCard } from '@/components/analytics/StatsCard'
import { ChartCard } from '@/components/analytics/ChartCard'



export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const reviews = filterPerformanceReviews(mockPerformanceReviews, user)
  const metrics = getMetricsForRole(mockPerformanceReviews, mockDevelopmentPlans, mockEmployees, user)
  const approvalRate = reviews.length > 0 
    ? Math.round((reviews.filter(r => r.status === 'approved').length / reviews.length) * 100)
    : 0

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
          Organization Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#94A3B8' }}>
          Complete organizational overview and performance metrics
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#14B8A6' }} />
        </Box>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Employees"
                value={mockEmployees.length}
                icon={<PeopleIcon />}
                color="#14B8A6"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Avg Performance Rating"
                value={metrics.averageRating?.toFixed(2) || '0'}
                unit="/ 5.0"
                icon={<BarChartIcon />}
                color="#3B82F6"
                trend={metrics.averageRating ? (metrics.averageRating > 4 ? 5 : -2) : 0}
                trendLabel="vs last quarter"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Review Completion"
                value={approvalRate}
                unit="%"
                icon={<CheckCircleIcon />}
                color="#10B981"
                progress={approvalRate}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Pending Reviews"
                value={reviews.filter(r => r.status !== 'approved').length}
                icon={<PendingIcon />}
                color="#F59E0B"
              />
            </Grid>
          </Grid>

          {/* Performance Reviews Section */}
          <ChartCard
            title="Recent Performance Reviews"
            subtitle={`${reviews.length} total reviews across organization`}
            sx={{ mb: 4 }}
          >
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#334155', borderBottom: '1px solid #475569' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Rating</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Reviewer</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviews.slice(0, 8).map((review) => (
                      <TableRow 
                        key={review.id} 
                        hover 
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: '#1E293B',
                          '&:hover': { backgroundColor: '#334155' },
                          borderBottom: '1px solid #334155',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500, color: '#F1F5F9' }}>
                          {review.employeeName}
                        </TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }}>{review.period}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor:
                                  review.rating >= 4.5
                                    ? '#10B981'
                                    : review.rating >= 3.5
                                    ? '#14B8A6'
                                    : '#F59E0B',
                              }}
                            />
                            <Typography sx={{ fontWeight: 500, color: '#F1F5F9' }}>
                              {review.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                            size="small"
                            sx={{
                              backgroundColor:
                                review.status === 'approved'
                                  ? '#10B98130'
                                  : review.status === 'submitted'
                                  ? '#3B82F630'
                                  : '#F59E0B30',
                              color:
                                review.status === 'approved'
                                  ? '#10B981'
                                  : review.status === 'submitted'
                                  ? '#3B82F6'
                                  : '#F59E0B',
                              border: 'none',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }}>{review.reviewer}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/reviews/${review.id}`)}
                            sx={{
                              color: '#14B8A6',
                              '&:hover': { backgroundColor: '#14B8A610' },
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
          </ChartCard>

          {/* Development Plans Overview */}
          <ChartCard
            title="Active Development Plans"
            subtitle={`${mockDevelopmentPlans.length} growth initiatives in progress`}
            actions={[{ label: 'View All Plans', onClick: () => navigate('/plans') }]}
          >
            <Grid container spacing={2}>
              {mockDevelopmentPlans.slice(0, 4).map((plan) => (
                <Grid item xs={12} sm={6} key={plan.id}>
                  <Box 
                    sx={{ 
                      p: 2.5, 
                      backgroundColor: '#334155', 
                      borderRadius: 1.5,
                      border: '1px solid #475569',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#3F4A5E',
                        borderColor: '#14B8A6',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#14B8A630',
                          color: '#14B8A6',
                          fontWeight: 700,
                        }}
                      >
                        {plan.employeeName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#F1F5F9' }}>
                          {plan.employeeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {plan.title}
                        </Typography>
                      </Box>
                    </Box>
                    {plan.goals.slice(0, 1).map((goal) => (
                      <Box key={goal.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, color: '#CBD5E1' }}>
                            {goal.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                            {goal.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={goal.progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#475569',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #14B8A6, #06B6D4)',
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </ChartCard>
        </>
      )}
    </Box>
  )
}
