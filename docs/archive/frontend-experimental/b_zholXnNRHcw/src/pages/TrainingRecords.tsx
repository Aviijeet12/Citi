import React, { useState } from 'react'
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
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { mockTrainingRecords } from '@/api/mockData'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { TrainingRecord } from '@/types'

export const TrainingRecords: React.FC = () => {
  const [records, setRecords] = useState<TrainingRecord[]>(mockTrainingRecords)
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const { showSnackbar } = useSnackbar()

  const filteredRecords = records.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (record?: TrainingRecord) => {
    if (record) {
      setSelectedRecord(record)
    } else {
      setSelectedRecord(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRecord(null)
  }

  const handleSaveRecord = async () => {
    if (!selectedRecord) return

    setIsLoading(true)
    try {
      const existingIndex = records.findIndex((r) => r.id === selectedRecord.id)
      if (existingIndex >= 0) {
        const updated = [...records]
        updated[existingIndex] = selectedRecord
        setRecords(updated)
        showSnackbar('Record updated successfully', 'success')
      } else {
        const newRecord: TrainingRecord = {
          ...selectedRecord,
          id: Date.now().toString(),
        }
        setRecords([...records, newRecord])
        showSnackbar('Record created successfully', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      showSnackbar('Failed to save record', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return

    try {
      setRecords(records.filter((r) => r.id !== id))
      showSnackbar('Record deleted successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to delete record', 'error')
    }
  }

  const totalHours = records.reduce((sum, record) => sum + record.hours, 0)
  const completedCount = records.filter((r) => r.status === 'completed').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 1 }}>
            Training Records
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666' }}>
            Monitor employee training and certification progress
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mt: { xs: 2, sm: 0 } }}
        >
          New Record
        </Button>
      </Box>

      {/* Summary Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card sx={{ background: 'linear-gradient(135deg, #06A8A8 0%, #048787 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Training Hours
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {totalHours}h
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Completed Trainings
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {completedCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by employee or course..."
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
                <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Completion Date</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: '#666666' }}>
                      {searchTerm ? 'No records found' : 'No training records yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    hover
                    sx={{ '&:hover': { backgroundColor: '#F5F7FA' } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{record.employeeName}</TableCell>
                    <TableCell>{record.courseTitle}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>{record.hours}h</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        variant="outlined"
                        size="small"
                        color={
                          record.status === 'completed'
                            ? 'success'
                            : record.status === 'in-progress'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{record.completionDate}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(record)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRecord(record.id)}
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
          {selectedRecord?.id ? 'Edit Training Record' : 'Create New Training Record'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label="Employee Name"
            value={selectedRecord?.employeeName || ''}
            onChange={(e) =>
              setSelectedRecord(
                selectedRecord
                  ? { ...selectedRecord, employeeName: e.target.value }
                  : {
                      id: '',
                      employeeId: '',
                      employeeName: e.target.value,
                      courseTitle: '',
                      provider: '',
                      completionDate: '',
                      hours: 0,
                      status: 'completed',
                    }
              )
            }
          />
          <TextField
            fullWidth
            label="Course Title"
            value={selectedRecord?.courseTitle || ''}
            onChange={(e) =>
              setSelectedRecord(
                selectedRecord ? { ...selectedRecord, courseTitle: e.target.value } : null
              )
            }
          />
          <TextField
            fullWidth
            label="Provider"
            value={selectedRecord?.provider || ''}
            onChange={(e) =>
              setSelectedRecord(
                selectedRecord ? { ...selectedRecord, provider: e.target.value } : null
              )
            }
          />
          <TextField
            fullWidth
            label="Hours"
            type="number"
            value={selectedRecord?.hours || 0}
            onChange={(e) =>
              setSelectedRecord(
                selectedRecord
                  ? { ...selectedRecord, hours: parseInt(e.target.value) || 0 }
                  : null
              )
            }
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            label="Completion Date"
            type="date"
            value={selectedRecord?.completionDate || ''}
            onChange={(e) =>
              setSelectedRecord(
                selectedRecord
                  ? { ...selectedRecord, completionDate: e.target.value }
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
            onClick={handleSaveRecord}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
