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
  Chip,
  Avatar,
} from '@mui/material'
import {
  Star as StarIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockDevelopmentPlans, mockTrainingRecords, mockEmployeeCompetencies } from '@/api/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { filterPerformanceReviews, filterDevelopmentPlans, filterTrainingRecords, filterCompetencies } from '@/utils/dataFilters'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, subtitle }) => (
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
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#666666', mt: 1, display: 'block' }}>
              {subtitle}
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

export const EmployeeDashboard: React.FC = () => {
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

  const myReviews = filterPerformanceReviews(mockPerformanceReviews, user)
  const myPlans = filterDevelopmentPlans(mockDevelopmentPlans, user)
  const myTraining = filterTrainingRecords(mockTrainingRecords, user)
  const myCompetencies = filterCompetencies(mockEmployeeCompetencies, user)

  const latestReview = myReviews[myReviews.length - 1]
  const activePlan = myPlans.find((p) => p.status === 'active')
  const completedTrainings = myTraining.filter((t) => t.status === 'completed').length

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              background: 'linear-gradient(135deg, #102A43 0%, #06A8A8 100%)',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {user?.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 0.5 }}>
              Welcome, {user?.name}
            </Typography>
            <Typography variant="body1" sx={{ color: '#666666' }}>
              Your personal performance dashboard
            </Typography>
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Latest Rating"
                value={latestReview?.rating.toFixed(1) || '—'}
                icon={<StarIcon sx={{ fontSize: 40 }} />}
                color="#F4B860"
                subtitle={latestReview?.period || 'No reviews yet'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Goals"
                value={activePlan?.goals.filter((g) => g.status !== 'completed').length || 0}
                icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                color="#06A8A8"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Training Hours"
                value={myTraining.reduce((sum, t) => sum + t.hours, 0)}
                icon={<SchoolIcon sx={{ fontSize: 40 }} />}
                color="#2E7D32"
                subtitle={`${completedTrainings} completed`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Competencies"
                value={myCompetencies.length}
                icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
                color="#102A43"
              />
            </Grid>
          </Grid>

          {/* Latest Performance Review */}
          {latestReview && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
                      Latest Performance Review
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666666' }}>
                      {latestReview.period}
                    </Typography>
                  </Box>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => navigate('/reviews')}
                  >
                    View All Reviews
                  </Button>
                </Box>

                <Box sx={{ p: 2, backgroundColor: '#F5F7FA', borderRadius: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                        Reviewer
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#102A43' }}>
                        {latestReview.reviewer}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 1,
                          backgroundColor:
                            latestReview.rating >= 4.5
                              ? '#2E7D3220'
                              : latestReview.rating >= 3.5
                              ? '#06A8A820'
                              : '#F4B86020',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color:
                              latestReview.rating >= 4.5
                                ? '#2E7D32'
                                : latestReview.rating >= 3.5
                                ? '#06A8A8'
                                : '#F4B860',
                          }}
                        >
                          {latestReview.rating.toFixed(1)} / 5.0
                        </Typography>
                      </Box>
                      <Chip
                        label={latestReview.status.charAt(0).toUpperCase() + latestReview.status.slice(1)}
                        color={
                          latestReview.status === 'approved'
                            ? 'success'
                            : latestReview.status === 'submitted'
                            ? 'primary'
                            : 'warning'
                        }
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1A1A1A', lineHeight: 1.6 }}>
                    {latestReview.comments}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Active Development Plan */}
          {activePlan && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
                      My Development Plan
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666666' }}>
                      {activePlan.title}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/development-plans')}
                  >
                    View Details
                  </Button>
                </Box>

                <Box>
                  {activePlan.goals.map((goal) => (
                    <Box key={goal.id} sx={{ mb: 2.5, last: { mb: 0 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#102A43' }}>
                            {goal.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            Due: {goal.dueDate}
                          </Typography>
                        </Box>
                        <Chip
                          label={goal.status === 'completed' ? 'Complete' : goal.status.replace('-', ' ')}
                          size="small"
                          color={goal.status === 'completed' ? 'success' : 'primary'}
                          variant={goal.status === 'completed' ? 'filled' : 'outlined'}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={goal.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#E5E9F0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              goal.progress === 100 ? '#2E7D32' : '#06A8A8',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#666666', mt: 0.5, display: 'block' }}>
                        {goal.progress}% complete
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Training & Learning */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
                    My Training History
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Completed and in-progress courses
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => navigate('/training-records')}
                >
                  View All
                </Button>
              </Box>

              {myTraining.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    No training records yet
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {myTraining.slice(0, 3).map((record) => (
                    <Box
                      key={record.id}
                      sx={{
                        p: 2,
                        backgroundColor: '#F5F7FA',
                        borderRadius: 1,
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#102A43' }}>
                          {record.courseTitle}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666666' }}>
                          {record.provider} • {record.hours}h • {record.completionDate}
                        </Typography>
                      </Box>
                      <Chip
                        label={record.status === 'completed' ? 'Complete' : record.status}
                        size="small"
                        color={record.status === 'completed' ? 'success' : 'primary'}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
