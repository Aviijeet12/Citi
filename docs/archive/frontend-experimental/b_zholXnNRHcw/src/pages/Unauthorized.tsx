import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  Typography,
  Button,
  Container,
} from '@mui/material'
import { Lock as LockIcon } from '@mui/icons-material'

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F7FA',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon
            sx={{
              fontSize: 80,
              color: '#C62828',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#102A43',
              mb: 1,
            }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666666',
              mb: 4,
            }}
          >
            You do not have permission to access this resource. Please contact your administrator if you believe this is an error.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Card>
      </Container>
    </Box>
  )
}
