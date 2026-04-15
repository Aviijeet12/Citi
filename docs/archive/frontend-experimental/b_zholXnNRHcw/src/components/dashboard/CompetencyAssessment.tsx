import React from 'react'
import {
  Box,
  Card,
  Typography,
  Rating,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  AddCircle as AddCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

interface Competency {
  id: string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  proficiency: number // 0-5
  assessmentDate: string
}

interface CompetencyAssessmentProps {
  competencies: Competency[]
  isEditable?: boolean
  onUpdate?: (competencyId: string, newProficiency: number) => void
}

const levelColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'var(--color-warning)'
    case 'intermediate':
      return 'var(--color-info)'
    case 'advanced':
      return 'var(--color-success)'
    case 'expert':
      return 'var(--color-primary)'
    default:
      return 'var(--color-text-muted)'
  }
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'Technical':
      return '⚙️'
    case 'Leadership':
      return '👤'
    case 'Soft Skills':
      return '💬'
    default:
      return '📚'
  }
}

export const CompetencyAssessment: React.FC<CompetencyAssessmentProps> = ({
  competencies,
  isEditable = false,
  onUpdate,
}) => {
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedCompetency, setSelectedCompetency] = React.useState<Competency | null>(null)
  const [newProficiency, setNewProficiency] = React.useState(0)

  // Group competencies by category
  const grouped = competencies.reduce(
    (acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = []
      }
      acc[comp.category].push(comp)
      return acc
    },
    {} as Record<string, Competency[]>
  )

  const handleEditClick = (competency: Competency) => {
    setSelectedCompetency(competency)
    setNewProficiency(competency.proficiency)
    setEditOpen(true)
  }

  const handleSave = () => {
    if (selectedCompetency && onUpdate) {
      onUpdate(selectedCompetency.id, newProficiency)
    }
    setEditOpen(false)
    setSelectedCompetency(null)
  }

  // Calculate overall competency level
  const avgProficiency = competencies.length > 0
    ? (competencies.reduce((sum, c) => sum + c.proficiency, 0) / competencies.length).toFixed(1)
    : 0

  return (
    <Box>
      {/* Overall Summary Card */}
      <Card
        sx={{
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontWeight: 600, mb: 1 }}>
              Overall Competency Level
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {avgProficiency}
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                / 5.0
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  sx={{
                    fontSize: '24px',
                    color: star <= Math.round(parseFloat(avgProficiency as string))
                      ? 'var(--color-warning)'
                      : 'var(--color-border)',
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
              {competencies.length} competencies assessed
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Competencies by Category */}
      {Object.entries(grouped).map(([category, comps]) => (
        <Card
          key={category}
          sx={{
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {categoryIcon(category)} {category}
            </Typography>
            <Chip
              label={comps.length}
              size="small"
              sx={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary)',
                fontWeight: 600,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            {comps.map((competency) => (
              <Grid item xs={12} key={competency.id}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {competency.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                        Assessed {new Date(competency.assessmentDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={competency.level}
                      size="small"
                      sx={{
                        backgroundColor: levelColor(competency.level) + '20',
                        color: levelColor(competency.level),
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>

                  {/* Proficiency Rating */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        Proficiency
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating
                          value={competency.proficiency}
                          precision={0.5}
                          readOnly
                          size="small"
                          icon={<StarIcon sx={{ fontSize: '18px' }} />}
                          emptyIcon={<StarIcon sx={{ fontSize: '18px', opacity: 0.3 }} />}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: '20px' }}>
                          {competency.proficiency.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(competency.proficiency / 5) * 100}
                      sx={{
                        height: 6,
                        borderRadius: '3px',
                        backgroundColor: 'var(--color-border)',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                        },
                      }}
                    />
                  </Box>

                  {/* Action Buttons */}
                  {isEditable && (
                    <Button
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: '16px' }} />}
                      onClick={() => handleEditClick(competency)}
                      sx={{
                        color: 'var(--color-primary)',
                        textTransform: 'none',
                        '&:hover': { backgroundColor: 'var(--color-primary-50)' },
                      }}
                    >
                      Update Assessment
                    </Button>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Competency Assessment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedCompetency && (
              <>
                <Alert severity="info" icon={<InfoIcon />}>
                  Update the proficiency level for <strong>{selectedCompetency.name}</strong>
                </Alert>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                    Proficiency Level
                  </Typography>
                  <Rating
                    value={newProficiency}
                    onChange={(_, value) => setNewProficiency(value || 0)}
                    size="large"
                    precision={0.5}
                    icon={<StarIcon sx={{ fontSize: '28px' }} />}
                    emptyIcon={<StarIcon sx={{ fontSize: '28px', opacity: 0.3 }} />}
                  />
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block', mt: 1 }}>
                    Current: {newProficiency.toFixed(1)} / 5.0
                  </Typography>
                </Box>

                <TextField
                  label="Assessment Notes"
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  placeholder="Add notes about this assessment..."
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ background: 'var(--gradient-primary)' }}
          >
            Save Assessment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
