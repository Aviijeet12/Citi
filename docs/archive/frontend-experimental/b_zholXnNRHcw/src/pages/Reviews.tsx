import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { mockPerformanceReviews } from '@/api/mockData'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { PerformanceReview } from '@/types'

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<PerformanceReview[]>(mockPerformanceReviews)
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null)
  const { showSnackbar } = useSnackbar()

  const filteredReviews = reviews.filter(
    (review) =>
      review.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (review?: PerformanceReview) => {
    if (review) {
      setSelectedReview(review)
    } else {
      setSelectedReview(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedReview(null)
  }

  const handleSaveReview = async () => {
    if (!selectedReview) return

    setIsLoading(true)
    try {
      const existingIndex = reviews.findIndex((r) => r.id === selectedReview.id)
      if (existingIndex >= 0) {
        const updated = [...reviews]
        updated[existingIndex] = selectedReview
        setReviews(updated)
        showSnackbar('Review updated successfully', 'success')
      } else {
        const newReview: PerformanceReview = {
          ...selectedReview,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }
        setReviews([...reviews, newReview])
        showSnackbar('Review created successfully', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      showSnackbar('Failed to save review', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return

    try {
      setReviews(reviews.filter((r) => r.id !== id))
      showSnackbar('Review deleted successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to delete review', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 1 }}>
            Performance Reviews
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666' }}>
            Manage employee performance evaluations and feedback
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mt: { xs: 2, sm: 0 } }}
        >
          New Review
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by employee or reviewer..."
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

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F5F7FA' }}>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reviewer</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: '#666666' }}>
                      {searchTerm ? 'No reviews found' : 'No reviews yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow
                    key={review.id}
                    hover
                    sx={{ '&:hover': { backgroundColor: '#F5F7FA' } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{review.employeeName}</TableCell>
                    <TableCell>{review.period}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={review.rating / 2} readOnly size="small" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {review.rating}
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
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{review.reviewer}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(review)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReview(review.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedReview?.id ? 'Edit Review' : 'Create New Review'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label="Employee Name"
            value={selectedReview?.employeeName || ''}
            onChange={(e) =>
              setSelectedReview(
                selectedReview
                  ? { ...selectedReview, employeeName: e.target.value }
                  : {
                      id: '',
                      employeeId: '',
                      employeeName: e.target.value,
                      period: '',
                      rating: 0,
                      status: 'draft',
                      reviewer: '',
                      comments: '',
                      createdAt: '',
                      updatedAt: '',
                    }
              )
            }
          />
          <TextField
            fullWidth
            label="Period"
            value={selectedReview?.period || ''}
            onChange={(e) =>
              setSelectedReview(
                selectedReview ? { ...selectedReview, period: e.target.value } : null
              )
            }
            placeholder="e.g., 2024-Q1"
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Rating
            </Typography>
            <Rating
              value={selectedReview?.rating ? selectedReview.rating / 2 : 0}
              onChange={(_, newValue) =>
                setSelectedReview(
                  selectedReview
                    ? { ...selectedReview, rating: (newValue || 0) * 2 }
                    : null
                )
              }
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            label="Reviewer"
            value={selectedReview?.reviewer || ''}
            onChange={(e) =>
              setSelectedReview(
                selectedReview ? { ...selectedReview, reviewer: e.target.value } : null
              )
            }
          />
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={4}
            value={selectedReview?.comments || ''}
            onChange={(e) =>
              setSelectedReview(
                selectedReview ? { ...selectedReview, comments: e.target.value } : null
              )
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveReview}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
