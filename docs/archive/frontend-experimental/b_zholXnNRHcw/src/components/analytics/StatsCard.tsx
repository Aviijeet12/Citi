import React from 'react'
import { Box, Typography, Card, LinearProgress } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  color?: string
  progress?: number
  subtext?: string
  onClick?: () => void
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color = '#00D9D9',
  progress,
  subtext,
  onClick,
}) => {
  const trendIsPositive = trend && trend > 0

  return (
    <Card
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${color}20`,
        borderRadius: '16px',
        p: 2.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `
          0 2px 4px rgba(0, 0, 0, 0.4),
          0 4px 8px rgba(0, 0, 0, 0.3),
          0 8px 16px rgba(0, 0, 0, 0.2)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`,
          pointerEvents: 'none',
        },
        '&:hover': {
          borderColor: color,
          boxShadow: `
            0 4px 8px rgba(0, 0, 0, 0.5),
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 16px 32px rgba(0, 0, 0, 0.3),
            0 0 20px ${color}30,
            0 0 40px ${color}15
          `,
          transform: onClick ? 'translateZ(20px) translateY(-4px) rotateX(2deg)' : 'translateZ(8px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: '#7A8699',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${color}30, ${color}10)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${color}40`,
              color: color,
              boxShadow: `
                0 2px 8px ${color}20,
                inset 0 1px 2px ${color}10
              `,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `
                  0 4px 16px ${color}30,
                  inset 0 1px 2px ${color}20
                `,
                transform: 'translateY(-2px) scale(1.05)',
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            {value}
          </Typography>
          {unit && (
            <Typography
              variant="caption"
              sx={{
                color: '#B8C5D6',
                fontWeight: 500,
              }}
            >
              {unit}
            </Typography>
          )}
        </Box>

        {trend !== undefined ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {trendIsPositive ? (
              <TrendingUp sx={{ fontSize: '16px', color: '#00D97E' }} />
            ) : (
              <TrendingDown sx={{ fontSize: '16px', color: '#FF6B6B' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trendIsPositive ? '#00D97E' : '#FF6B6B',
                fontWeight: 600,
              }}
            >
              {Math.abs(trend)}% {trendIsPositive ? 'up' : 'down'} {trendLabel || 'this month'}
            </Typography>
          </Box>
        ) : subtext ? (
          <Typography
            variant="caption"
            sx={{
              color: '#7A8699',
              display: 'block',
              mt: 0.75,
            }}
          >
            {subtext}
          </Typography>
        ) : null}
      </Box>

      {progress !== undefined && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 500, color: '#7A8699' }}>
              Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: color }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: '3px',
              backgroundColor: '#2A3142',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
              },
            }}
          />
        </Box>
      )}
    </Card>
  )
}
