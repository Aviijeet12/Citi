import React from 'react'
import { Box, Card, Typography, IconButton, Menu, MenuItem, SxProps, Theme } from '@mui/material'
import { MoreVert as MoreVertIcon } from '@mui/icons-material'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  isLoading?: boolean
  actions?: { label: string; onClick: () => void }[]
  sx?: SxProps<Theme>
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  isLoading = false,
  actions,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        border: '1px solid #475569',
        borderRadius: 2,
        p: 3,
        height: '100%',
        position: 'relative',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#F1F5F9',
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#94A3B8',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && actions.length > 0 && (
          <>
            <IconButton
              size="small"
              onClick={handleClick}
              sx={{
                color: '#94A3B8',
                '&:hover': { color: '#14B8A6' },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  background: '#1E293B',
                  border: '1px solid #475569',
                  '& .MuiMenuItem-root': {
                    color: '#F1F5F9',
                    '&:hover': { backgroundColor: '#334155' },
                  },
                },
              }}
            >
              {actions.map((action, idx) => (
                <MenuItem
                  key={idx}
                  onClick={() => {
                    action.onClick()
                    handleClose()
                  }}
                >
                  {action.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#94A3B8' }}>Loading...</Typography>
        </Box>
      ) : (
        children
      )}
    </Card>
  )
}
