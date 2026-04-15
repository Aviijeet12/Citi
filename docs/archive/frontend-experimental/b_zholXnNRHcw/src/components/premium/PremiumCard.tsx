import React, { useState } from 'react'
import { Card, CardProps, Box } from '@mui/material'

interface PremiumCardProps extends CardProps {
  hoverable?: boolean
  glowColor?: string
  deepShadow?: boolean
  children: React.ReactNode
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  hoverable = true,
  glowColor = '#00D9D9',
  deepShadow = true,
  children,
  ...props
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverable) return

    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <Card
      {...props}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      sx={{
        background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${glowColor}20`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: deepShadow
          ? `
              0 2px 4px rgba(0, 0, 0, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.3),
              0 8px 16px rgba(0, 0, 0, 0.2)
            `
          : undefined,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${glowColor}, transparent)`,
          opacity: isHovering ? 1 : 0.3,
          transition: 'opacity 0.3s ease',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${glowColor}10 0%, transparent 100%)`,
          pointerEvents: 'none',
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.3s ease',
        },
        ...(hoverable && {
          cursor: 'pointer',
          '&:hover': {
            borderColor: glowColor,
            boxShadow: `
              0 4px 8px rgba(0, 0, 0, 0.5),
              0 8px 16px rgba(0, 0, 0, 0.4),
              0 16px 32px rgba(0, 0, 0, 0.3),
              0 0 20px ${glowColor}30,
              0 0 40px ${glowColor}15
            `,
            transform: 'translateZ(20px) translateY(-6px) rotateX(3deg)',
          },
        }),
        ...props.sx,
      }}
    >
      {/* Spotlight Effect on Hover */}
      {hoverable && isHovering && (
        <Box
          sx={{
            position: 'absolute',
            pointerEvents: 'none',
            borderRadius: '50%',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)`,
            transform: `translate(${mousePosition.x - 150}px, ${mousePosition.y - 150}px)`,
            transition: 'all 0.3s ease-out',
            zIndex: 1,
          }}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 2 }}>{children}</Box>
    </Card>
  )
}
