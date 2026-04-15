import React from 'react'
import { Box } from '@mui/material'

interface Dashboard3DContainerProps {
  children: React.ReactNode
  gradientColor?: string
}

export const Dashboard3DContainer: React.FC<Dashboard3DContainerProps> = ({
  children,
  gradientColor = 'rgba(0, 217, 217, 0.1)',
}) => {
  return (
    <Box
      sx={{
        perspective: '1200px',
        '& > *': {
          transformStyle: 'preserve-3d',
        },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${gradientColor} 0%, transparent 100%)`,
          borderRadius: '20px',
          p: 3,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gradientColor}`,
          boxShadow: `
            0 8px 16px rgba(0, 0, 0, 0.5),
            0 16px 32px rgba(0, 0, 0, 0.4),
            0 32px 64px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(0, 217, 217, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 1,
          },
          '&:hover': {
            boxShadow: `
              0 12px 24px rgba(0, 0, 0, 0.6),
              0 24px 48px rgba(0, 0, 0, 0.5),
              0 48px 96px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
            transform: 'translateZ(10px)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
