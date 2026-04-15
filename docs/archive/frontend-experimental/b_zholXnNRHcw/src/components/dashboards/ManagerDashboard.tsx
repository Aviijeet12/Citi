import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  Alert,
} from '@mui/material'
import {
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as AlertIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockEmployees, mockDevelopmentPlans } from '@/api/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { filterPerformanceReviews, filterDevelopmentPlans, filterEmployees, getMetricsForRole } from '@/utils/dataFilters'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, trend }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      border: `1px solid ${color}30`,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${color}20`,
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#102A43' }}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" sx={{ color: '#2E7D32', mt: 1, display: 'block' }}>
              {trend}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, opacity: 0.7 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export const ManagerDashboard: React.FC = () => {
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

  const teamMembers = filterEmployees(mockEmployees, user)
  const reviews = filterPerformanceReviews(mockPerformanceReviews, user)
  const plans = filterDevelopmentPlans(mockDevelopmentPlans, user)
  const metrics = getMetricsForRole(mockPerformanceReviews, mockDevelopmentPlans, mockEmployees, user)

  const pendingReviews = reviews.filter((r) => r.status !== 'approved')
  const activePlans = plans.filter((p) => p.status === 'active')

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 1 }}>
          Team Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Manage your team's performance, development, and growth
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {pendingReviews.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <AlertIcon sx={{ mr: 1 }} />
              You have {pendingReviews.length} pending review(s) to complete
            </Alert>
          )}

          {/* Team Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Team Size"
                value={metrics.teamSize || 0}
                icon={<GroupIcon sx={{ fontSize: 40 }} />}
                color="#102A43"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Team Avg Rating"
                value={metrics.averageRating?.toFixed(2) || '—'}
                icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                color="#06A8A8"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Pending Reviews"
                value={pendingReviews.length}
                icon={<AlertIcon sx={{ fontSize: 40 }} />}
                color="#F4B860"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Plans"
                value={activePlans.length}
                icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
                color="#2E7D32"
              />
            </Grid>
          </Grid>

          {/* Team Members and Reviews */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
                    Team Performance Reviews
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Your team members' evaluations
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/reviews')}
                >
                  Create Review
                </Button>
              </Box>

              {reviews.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#666666' }}>
                    No reviews yet. Start evaluating your team members.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Team Member</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow key={review.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {review.employeeName}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor:
                                    review.rating >= 4.5
                                      ? '#2E7D32'
                                      : review.rating >= 3.5
                                      ? '#06A8A8'
                                      : '#F4B860',
                                }}
                              />
                              <Typography sx={{ fontWeight: 500 }}>
                                {review.rating.toFixed(1)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                              variant="outlined"
                              size="small"
                              color={
                                review.status === 'approved'
                                  ? 'success'
                                  : review.status === 'submitted'
                                  ? 'primary'
                                  : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>{review.updatedAt}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => navigate(`/reviews/${review.id}`)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Development Plans */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
                    Team Development Plans
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Track team member growth initiatives
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/development-plans')}
                >
                  View All Plans
                </Button>
              </Box>

              <Grid container spacing={2}>
                {activePlans.slice(0, 3).map((plan) => (
                  <Grid item xs={12} md={6} key={plan.id}>
                    <Box sx={{ p: 2, backgroundColor: '#F5F7FA', borderRadius: 1, border: '1px solid #E5E9F0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#102A43', mb: 1 }}>
                        {plan.employeeName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
                        {plan.title}
                      </Typography>
                      <Box>
                        {plan.goals.map((goal) => (
                          <Box key={goal.id} sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 500, color: '#1A1A1A', flex: 1 }}>
                                {goal.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666666', fontWeight: 500 }}>
                                {goal.progress}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={goal.progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#E5E9F0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    goal.progress === 100 ? '#2E7D32' : '#06A8A8',
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
