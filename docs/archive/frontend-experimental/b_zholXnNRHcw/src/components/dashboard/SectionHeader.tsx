import React from 'react'
import { Box, Typography, Button, Tooltip } from '@mui/material'
import { Info as InfoIcon, Add as AddIcon } from '@mui/icons-material'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  info?: string
  badge?: React.ReactNode
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  info,
  badge,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontSize: '1.1rem',
              }}
            >
              {title}
            </Typography>
            {badge && badge}
            {info && (
              <Tooltip title={info}>
                <InfoIcon sx={{ fontSize: '18px', color: 'var(--color-text-muted)' }} />
              </Tooltip>
            )}
          </Box>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            background: 'var(--gradient-primary)',
            border: 'none',
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
