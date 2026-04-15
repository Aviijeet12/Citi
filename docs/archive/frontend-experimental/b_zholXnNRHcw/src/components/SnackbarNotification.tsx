import React from 'react'
import { Snackbar, Alert, Box } from '@mui/material'
import { useSnackbar } from '@/contexts/SnackbarContext'

export const SnackbarNotification: React.FC = () => {
  const { messages, removeSnackbar } = useSnackbar()

  return (
    <Box sx={{ position: 'fixed', bottom: 0, right: 0, zIndex: 1400 }}>
      {messages.map((msg) => (
        <Snackbar
          key={msg.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => removeSnackbar(msg.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ mb: messages.indexOf(msg) * 80 + 'px' }}
        >
          <Alert
            onClose={() => removeSnackbar(msg.id)}
            severity={msg.severity}
            sx={{ width: '100%', minWidth: 320 }}
          >
            {msg.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  )
}
