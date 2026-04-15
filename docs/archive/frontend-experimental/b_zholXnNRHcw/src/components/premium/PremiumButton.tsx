import React, { useState } from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'

interface PremiumButtonProps extends ButtonProps {
  isLoading?: boolean
  showRipple?: boolean
  glowEffect?: boolean
  children: React.ReactNode
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  isLoading = false,
  showRipple = true,
  glowEffect = true,
  children,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!showRipple) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples([...ripples, { id, x, y }])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }

  return (
    <Button
      {...props}
      disabled={isLoading || props.disabled}
      onMouseDown={handleMouseDown}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        textTransform: 'none',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        borderRadius: '10px',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        ...(glowEffect && {
          '&:hover:not(:disabled)': {
            boxShadow: '0 0 20px rgba(0, 217, 217, 0.4), 0 8px 20px rgba(0, 217, 217, 0.2)',
          },
        }),
        ...props.sx,
      }}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            animation: `ripple 0.6s ease-out`,
          }}
        />
      ))}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircularProgress size={20} color="inherit" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
}
