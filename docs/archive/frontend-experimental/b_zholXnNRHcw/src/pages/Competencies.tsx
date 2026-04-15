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
  Rating,
  Chip,
  Grid,
  IconButton,
  CircularProgress,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { mockEmployeeCompetencies, mockCompetencies } from '@/api/mockData'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { EmployeeCompetency } from '@/types'

export const Competencies: React.FC = () => {
  const [competencies, setCompetencies] = useState<EmployeeCompetency[]>(mockEmployeeCompetencies)
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompetency, setSelectedCompetency] = useState<EmployeeCompetency | null>(null)
  const { showSnackbar } = useSnackbar()

  const filteredCompetencies = competencies.filter(
    (comp) =>
      comp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.competency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (comp?: EmployeeCompetency) => {
    if (comp) {
      setSelectedCompetency(comp)
    } else {
      setSelectedCompetency(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedCompetency(null)
  }

  const handleSaveCompetency = async () => {
    if (!selectedCompetency) return

    setIsLoading(true)
    try {
      const existingIndex = competencies.findIndex((c) => c.id === selectedCompetency.id)
      if (existingIndex >= 0) {
        const updated = [...competencies]
        updated[existingIndex] = selectedCompetency
        setCompetencies(updated)
        showSnackbar('Competency updated successfully', 'success')
      } else {
        const newCompetency: EmployeeCompetency = {
          ...selectedCompetency,
          id: Date.now().toString(),
        }
        setCompetencies([...competencies, newCompetency])
        showSnackbar('Competency created successfully', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      showSnackbar('Failed to save competency', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCompetency = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this competency assignment?'))
      return

    try {
      setCompetencies(competencies.filter((c) => c.id !== id))
      showSnackbar('Competency deleted successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to delete competency', 'error')
    }
  }

  const getProficiencyColor = (proficiency: number): string => {
    if (proficiency >= 4.5) return '#2E7D32'
    if (proficiency >= 3.5) return '#06A8A8'
    if (proficiency >= 2.5) return '#F4B860'
    return '#C62828'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 1 }}>
            Competencies
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666' }}>
            Manage employee skills and competency assessments
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mt: { xs: 2, sm: 0 } }}
        >
          Assess Competency
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by employee or competency..."
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
        {filteredCompetencies.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#666666' }}>
                  {searchTerm
                    ? 'No competencies found'
                    : 'No competency assessments yet'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredCompetencies.map((comp) => (
            <Grid item xs={12} md={6} key={comp.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#102A43' }}>
                        {comp.competency.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        {comp.employeeName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(comp)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCompetency(comp.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 1.5 }}>
                    {comp.competency.description}
                  </Typography>

                  <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#F5F7FA', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                        Proficiency Level
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getProficiencyColor(comp.proficiency),
                        }}
                      >
                        {comp.proficiency.toFixed(1)}/5.0
                      </Typography>
                    </Box>
                    <Rating
                      value={comp.proficiency}
                      readOnly
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: getProficiencyColor(comp.proficiency),
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={comp.competency.level.toUpperCase()}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: getProficiencyColor(comp.proficiency),
                        color: getProficiencyColor(comp.proficiency),
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#999999' }}>
                      Assessed: {comp.assessmentDate}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCompetency?.id
            ? 'Update Competency Assessment'
            : 'Create New Competency Assessment'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label="Employee Name"
            value={selectedCompetency?.employeeName || ''}
            onChange={(e) =>
              setSelectedCompetency(
                selectedCompetency
                  ? { ...selectedCompetency, employeeName: e.target.value }
                  : {
                      id: '',
                      employeeId: '',
                      employeeName: e.target.value,
                      competency: mockCompetencies[0],
                      proficiency: 0,
                      assessmentDate: '',
                    }
              )
            }
          />
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Competency
            </Typography>
            <Select
              value={selectedCompetency?.competency?.id || ''}
              onChange={(e) => {
                const comp = mockCompetencies.find((c) => c.id === e.target.value)
                if (comp && selectedCompetency) {
                  setSelectedCompetency({ ...selectedCompetency, competency: comp })
                }
              }}
            >
              {mockCompetencies.map((comp) => (
                <MenuItem key={comp.id} value={comp.id}>
                  {comp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Proficiency Level
            </Typography>
            <Rating
              value={selectedCompetency?.proficiency || 0}
              onChange={(_, newValue) =>
                setSelectedCompetency(
                  selectedCompetency
                    ? { ...selectedCompetency, proficiency: newValue || 0 }
                    : null
                )
              }
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            label="Assessment Date"
            type="date"
            value={selectedCompetency?.assessmentDate || ''}
            onChange={(e) =>
              setSelectedCompetency(
                selectedCompetency
                  ? { ...selectedCompetency, assessmentDate: e.target.value }
                  : null
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
            onClick={handleSaveCompetency}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
