import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  Box,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface PremiumModalProps extends DialogProps {
  title?: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
  showBackdrop?: boolean
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  title,
  onClose,
  children,
  actions,
  showBackdrop = true,
  ...props
}) => {
  return (
    <Dialog
      {...props}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
      }}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.95), rgba(26, 31, 46, 0.85))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 217, 217, 0.25)',
          borderRadius: '20px',
          boxShadow: `
            0 8px 16px rgba(0, 0, 0, 0.5),
            0 16px 32px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(0, 217, 217, 0.1)
          `,
          minWidth: '500px',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      }}
      TransitionProps={{
        timeout: { enter: 300, exit: 200 },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, rgba(0, 217, 217, 0.1) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(0, 217, 217, 0.15)',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: '#00d9d9',
            letterSpacing: '0.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          }}
        >
          <span>{title}</span>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#7a8699',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#00d9d9',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent
        sx={{
          color: '#b8c5d6',
          py: 3,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#3a4556',
            borderRadius: '4px',
            '&:hover': {
              background: '#00d9d9',
            },
          },
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(0, 217, 217, 0.1)',
            background: 'linear-gradient(135deg, rgba(0, 217, 217, 0.05) 0%, transparent 100%)',
            p: 2,
            gap: 1,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}
