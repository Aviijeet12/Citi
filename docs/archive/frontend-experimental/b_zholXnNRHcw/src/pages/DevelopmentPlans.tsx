import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { mockDevelopmentPlans } from '@/api/mockData'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { DevelopmentPlan } from '@/types'

export const DevelopmentPlans: React.FC = () => {
  const [plans, setPlans] = useState<DevelopmentPlan[]>(mockDevelopmentPlans)
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<DevelopmentPlan | null>(null)
  const { showSnackbar } = useSnackbar()

  const filteredPlans = plans.filter((plan) =>
    plan.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (plan?: DevelopmentPlan) => {
    if (plan) {
      setSelectedPlan(plan)
    } else {
      setSelectedPlan(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedPlan(null)
  }

  const handleSavePlan = async () => {
    if (!selectedPlan) return

    setIsLoading(true)
    try {
      const existingIndex = plans.findIndex((p) => p.id === selectedPlan.id)
      if (existingIndex >= 0) {
        const updated = [...plans]
        updated[existingIndex] = selectedPlan
        setPlans(updated)
        showSnackbar('Plan updated successfully', 'success')
      } else {
        const newPlan: DevelopmentPlan = {
          ...selectedPlan,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0],
        }
        setPlans([...plans, newPlan])
        showSnackbar('Plan created successfully', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      showSnackbar('Failed to save plan', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return

    try {
      setPlans(plans.filter((p) => p.id !== id))
      showSnackbar('Plan deleted successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to delete plan', 'error')
    }
  }

  const calculatePlanProgress = (plan: DevelopmentPlan): number => {
    if (plan.goals.length === 0) return 0
    const completedGoals = plan.goals.filter((g) => g.status === 'completed').length
    return Math.round((completedGoals / plan.goals.length) * 100)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 1 }}>
            Development Plans
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666' }}>
            Track employee growth and development objectives
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mt: { xs: 2, sm: 0 } }}
        >
          New Plan
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by employee or plan title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666666' }} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filteredPlans.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#666666' }}>
                  {searchTerm ? 'No plans found' : 'No development plans yet'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredPlans.map((plan) => (
            <Grid item xs={12} md={6} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#102A43' }}>
                        {plan.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        {plan.employeeName}
                      </Typography>
                    </Box>
                    <Chip
                      label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      color={plan.status === 'active' ? 'primary' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        Progress
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#102A43' }}>
                        {calculatePlanProgress(plan)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculatePlanProgress(plan)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#E5E9F0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#06A8A8',
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A', mb: 1 }}>
                      Goals ({plan.goals.length})
                    </Typography>
                    {plan.goals.slice(0, 2).map((goal) => (
                      <Box
                        key={goal.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                          p: 1,
                          backgroundColor: '#F5F7FA',
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor:
                              goal.status === 'completed'
                                ? '#2E7D32'
                                : goal.status === 'in-progress'
                                ? '#06A8A8'
                                : '#D0D7E0',
                          }}
                        />
                        <Typography variant="caption" sx={{ flex: 1, color: '#666666' }}>
                          {goal.title}
                        </Typography>
                      </Box>
                    ))}
                    {plan.goals.length > 2 && (
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        +{plan.goals.length - 2} more goals
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', color: '#666666', fontSize: '0.85rem' }}>
                    <span>{plan.startDate}</span>
                    <span>→</span>
                    <span>{plan.endDate}</span>
                  </Box>
                </CardContent>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 2,
                    borderTop: '1px solid #E5E9F0',
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOpenDialog(plan)}
                    startIcon={<EditIcon fontSize="small" />}
                  >
                    Edit
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePlan(plan.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPlan?.id ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label="Employee Name"
            value={selectedPlan?.employeeName || ''}
            onChange={(e) =>
              setSelectedPlan(
                selectedPlan
                  ? { ...selectedPlan, employeeName: e.target.value }
                  : {
                      id: '',
                      employeeId: '',
                      employeeName: e.target.value,
                      title: '',
                      startDate: '',
                      endDate: '',
                      status: 'active',
                      goals: [],
                      createdAt: '',
                    }
              )
            }
          />
          <TextField
            fullWidth
            label="Plan Title"
            value={selectedPlan?.title || ''}
            onChange={(e) =>
              setSelectedPlan(
                selectedPlan ? { ...selectedPlan, title: e.target.value } : null
              )
            }
          />
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={selectedPlan?.startDate || ''}
            onChange={(e) =>
              setSelectedPlan(
                selectedPlan ? { ...selectedPlan, startDate: e.target.value } : null
              )
            }
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={selectedPlan?.endDate || ''}
            onChange={(e) =>
              setSelectedPlan(
                selectedPlan ? { ...selectedPlan, endDate: e.target.value } : null
              )
            }
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSavePlan}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
