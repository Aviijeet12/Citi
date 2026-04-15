import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  Assignment as ReviewIcon,
  BookmarkAdded as PlanIcon,
  School as TrainingIcon,
  Psychology as CompetencyIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  mockEmployees,
  mockPerformanceReviews,
  mockDevelopmentPlans,
  mockTrainingRecords,
  mockEmployeeCompetencies,
} from '@/api/mockData'

interface SearchResult {
  id: string
  type: 'employee' | 'review' | 'plan' | 'training' | 'competency'
  title: string
  subtitle?: string
  icon: React.ReactNode
  path: string
}

export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const results: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    const allResults: SearchResult[] = []

    // Search employees
    mockEmployees
      .filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.department.toLowerCase().includes(query)
      )
      .forEach((emp) => {
        allResults.push({
          id: emp.id,
          type: 'employee',
          title: emp.name,
          subtitle: `${emp.jobTitle} • ${emp.department}`,
          icon: <PersonIcon />,
          path: '#',
        })
      })

    // Search reviews
    mockPerformanceReviews
      .filter(
        (review) =>
          review.employeeName.toLowerCase().includes(query) ||
          review.reviewer.toLowerCase().includes(query) ||
          review.period.toLowerCase().includes(query)
      )
      .forEach((review) => {
        allResults.push({
          id: review.id,
          type: 'review',
          title: `Review: ${review.employeeName}`,
          subtitle: `Period: ${review.period} • Rating: ${review.rating}`,
          icon: <ReviewIcon />,
          path: '/reviews',
        })
      })

    // Search development plans
    mockDevelopmentPlans
      .filter(
        (plan) =>
          plan.employeeName.toLowerCase().includes(query) ||
          plan.title.toLowerCase().includes(query)
      )
      .forEach((plan) => {
        allResults.push({
          id: plan.id,
          type: 'plan',
          title: plan.title,
          subtitle: `Employee: ${plan.employeeName}`,
          icon: <PlanIcon />,
          path: '/plans',
        })
      })

    // Search training records
    mockTrainingRecords
      .filter(
        (training) =>
          training.employeeName.toLowerCase().includes(query) ||
          training.courseTitle.toLowerCase().includes(query) ||
          training.provider.toLowerCase().includes(query)
      )
      .forEach((training) => {
        allResults.push({
          id: training.id,
          type: 'training',
          title: training.courseTitle,
          subtitle: `${training.employeeName} • ${training.provider}`,
          icon: <TrainingIcon />,
          path: '/training',
        })
      })

    // Search competencies
    mockEmployeeCompetencies
      .filter(
        (comp) =>
          comp.employeeName.toLowerCase().includes(query) ||
          comp.competency.name.toLowerCase().includes(query)
      )
      .forEach((comp) => {
        allResults.push({
          id: comp.id,
          type: 'competency',
          title: comp.competency.name,
          subtitle: `Employee: ${comp.employeeName}`,
          icon: <CompetencyIcon />,
          path: '/competencies',
        })
      })

    return allResults
  }, [searchQuery])

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path)
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Search employees, reviews, plans, trainings, competencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666666', fontSize: '1.5rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-input': {
                fontSize: '1.1rem',
              },
            }}
          />
        </CardContent>
      </Card>

      {searchQuery.trim() && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {results.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: '#666666' }}>
                  No results found for "{searchQuery}"
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%' }}>
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItemButton
                      onClick={() => handleSelectResult(result)}
                      sx={{
                        py: 2,
                        '&:hover': {
                          backgroundColor: '#F5F7FA',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: '#102A43', minWidth: 40 }}>
                        {result.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.title}
                        secondary={result.subtitle}
                        primaryTypographyProps={{
                          sx: { fontWeight: 500, color: '#1A1A1A' },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: '#666666' },
                        }}
                      />
                    </ListItemButton>
                    {index < results.length - 1 && <Divider sx={{ my: 0 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {!searchQuery.trim() && (
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: '#D0D7E0', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#666666' }}>
              Start typing to search
            </Typography>
            <Typography variant="body2" sx={{ color: '#999999', mt: 1 }}>
              Search across employees, reviews, development plans, training records, and competencies
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
