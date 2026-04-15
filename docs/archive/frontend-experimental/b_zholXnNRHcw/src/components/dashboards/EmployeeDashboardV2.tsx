import React from 'react'
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
  Alert,
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  MyLocation as TargetIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { mockPerformanceReviews, mockDevelopmentPlans, mockTrainingRecords, mockCompetencies } from '@/api/mockData'
import { StatsCard } from '@/components/analytics/StatsCard'
import { SectionHeader } from '@/components/dashboard/SectionHeader'

// Mock current employee (employee #1)
const getCurrentEmployeeData = () => ({
  id: '1',
  name: 'Sarah Johnson',
  department: 'Engineering',
  jobTitle: 'Senior Software Engineer',
  averageRating: 4.5,
})

export const EmployeeDashboardV2: React.FC = () => {
  const [editGoalOpen, setEditGoalOpen] = React.useState(false)
  const [selectedGoal, setSelectedGoal] = React.useState<any>(null)
  const navigate = useNavigate()

  const employee = getCurrentEmployeeData()
  const employeeReviews = mockPerformanceReviews.filter((r) => r.employeeId === '1')
  const employeePlans = mockDevelopmentPlans.filter((p) => p.employeeId === '1')
  const employeeTraining = mockTrainingRecords.filter((t) => t.employeeId === '1')
  const completedTraining = employeeTraining.filter((t) => t.status === 'completed')

  const handleGoalEdit = (goal: any) => {
    setSelectedGoal(goal)
    setEditGoalOpen(true)
  }

  const handleGoalSave = () => {
    setEditGoalOpen(false)
    setSelectedGoal(null)
  }

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
          Welcome back, {employee.name}
        </Typography>
        <Typography sx={{ color: 'var(--color-text-muted)' }}>
          Track your performance, development, and growth
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 3,
          backgroundColor: 'var(--color-info-50)',
          color: 'var(--color-info)',
          border: '1px solid var(--color-info)',
        }}
      >
        Your personal information is protected and read-only. Contact your manager for any changes to your profile or performance data.
      </Alert>

      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Your Rating"
            value={employee.averageRating}
            unit="/5.0"
            icon={<TrendingUpIcon />}
            color="#0D9488"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Reviews"
            value={employeeReviews.length}
            icon={<CheckCircleIcon />}
            color="#059669"
            subtext={`${employeeReviews.filter((r) => r.status === 'approved').length} approved`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Trainings Completed"
            value={completedTraining.length}
            icon={<SchoolIcon />}
            color="#2563EB"
            subtext={`${employeeTraining.reduce((sum, t) => sum + t.hours, 0)} total hours`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Goals"
            value={employeePlans.reduce((sum, p) => sum + p.goals.length, 0)}
            icon={<TargetIcon />}
            color="#7C3AED"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Development Plans */}
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
                title="Your Development Plan"
                subtitle="Goals for growth and skill development"
                icon={<TargetIcon />}
              />

              {employeePlans.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <TargetIcon sx={{ fontSize: '48px', mb: 2, opacity: 0.5 }} />
                  <Typography>No active development plans yet. Discuss with your manager to create one.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {employeePlans.map((plan) => (
                    <Box key={plan.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {plan.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                            {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                          size="small"
                          sx={{
                            backgroundColor: 'var(--color-success-50)',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {plan.goals.map((goal) => (
                          <Box
                            key={goal.id}
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
                                  {goal.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                                  {goal.description}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                startIcon={<EditIcon sx={{ fontSize: '16px' }} />}
                                onClick={() => handleGoalEdit(goal)}
                                sx={{
                                  color: 'var(--color-primary)',
                                  textTransform: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Update
                              </Button>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                Progress
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {goal.progress}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={goal.progress}
                              sx={{
                                height: 6,
                                borderRadius: '3px',
                                backgroundColor: 'var(--color-border)',
                                '& .MuiLinearProgress-bar': {
                                  background: 'var(--gradient-primary)',
                                },
                              }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid var(--color-border)' }}>
                              <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                                Status: {goal.status.replace('-', ' ').toUpperCase()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                                Due: {new Date(goal.dueDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Sidebar Panels */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Performance Reviews */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Your Reviews"
                  subtitle={`${employeeReviews.length} total reviews`}
                  icon={<CheckCircleIcon />}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {employeeReviews.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', textAlign: 'center', py: 3 }}>
                      No reviews yet
                    </Typography>
                  ) : (
                    employeeReviews.map((review) => (
                      <Box
                        key={review.id}
                        sx={{
                          p: 2,
                          backgroundColor: 'var(--color-bg-secondary)',
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                              {review.period}
                            </Typography>
                          </Box>
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
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                              {review.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                          size="small"
                          sx={{
                            backgroundColor:
                              review.status === 'approved' ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                            color:
                              review.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Training Records */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  p: 3,
                }}
              >
                <SectionHeader
                  title="Training History"
                  subtitle={`${completedTraining.length} completed`}
                  icon={<SchoolIcon />}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {employeeTraining.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', textAlign: 'center', py: 3 }}>
                      No trainings yet
                    </Typography>
                  ) : (
                    employeeTraining.map((training) => (
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
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>
                              {training.courseTitle}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
                              {training.provider} • {training.hours}h
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
                    ))
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Goal Edit Dialog */}
      <Dialog open={editGoalOpen} onClose={() => setEditGoalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Goal Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Goal
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>{selectedGoal?.title}</Typography>
            </Box>
            <TextField
              label="Progress (%)"
              type="number"
              fullWidth
              variant="outlined"
              defaultValue={selectedGoal?.progress || 0}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              placeholder="Update your progress notes..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGoalOpen(false)}>Cancel</Button>
          <Button onClick={handleGoalSave} variant="contained" sx={{ background: 'var(--gradient-primary)' }}>
            Save Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
