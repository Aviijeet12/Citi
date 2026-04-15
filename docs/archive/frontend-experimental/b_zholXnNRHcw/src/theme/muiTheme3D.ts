import { createTheme } from '@mui/material/styles'

export const theme3D = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0F1419',
      paper: '#1E2633',
    },
    primary: {
      main: '#00D9D9',
      dark: '#00B3B3',
      light: '#4FE5E5',
    },
    secondary: {
      main: '#0066FF',
      light: '#4D94FF',
    },
    success: {
      main: '#00D97E',
      light: '#4FE5A8',
    },
    warning: {
      main: '#FF8A00',
      light: '#FFB84D',
    },
    error: {
      main: '#FF6B6B',
      light: '#FF9999',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B8C5D6',
    },
    divider: '#3A4556',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-1px',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 217, 217, 0.1)',
          borderRadius: '16px',
          boxShadow: `
            0 2px 4px rgba(0, 0, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 8px 16px rgba(0, 0, 0, 0.2)
          `,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'translateZ(20px) translateY(-4px) rotateX(2deg)',
            boxShadow: `
              0 4px 8px rgba(0, 0, 0, 0.5),
              0 8px 16px rgba(0, 0, 0, 0.4),
              0 16px 32px rgba(0, 0, 0, 0.3),
              0 24px 48px rgba(0, 0, 0, 0.15)
            `,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          position: 'relative',
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 1,
          },
          '&:hover': {
            transform: 'translateZ(8px) translateY(-2px)',
            boxShadow: `
              0 4px 8px rgba(0, 0, 0, 0.5),
              0 8px 16px rgba(0, 0, 0, 0.4),
              0 16px 32px rgba(0, 0, 0, 0.3)
            `,
          },
          '&:active': {
            transform: 'translateZ(2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D9D9 0%, #4FE5E5 100%)',
          color: '#0F1419',
          boxShadow: `
            0 2px 4px rgba(0, 217, 217, 0.2),
            0 4px 12px rgba(0, 217, 217, 0.15)
          `,
          '&:hover': {
            background: 'linear-gradient(135deg, #4FE5E5 0%, #00D9D9 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: 'rgba(0, 217, 217, 0.5)',
          color: '#00D9D9',
          '&:hover': {
            borderColor: '#00D9D9',
            backgroundColor: 'rgba(0, 217, 217, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'linear-gradient(135deg, rgba(42, 49, 66, 0.6), rgba(30, 38, 51, 0.4))',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            '& fieldset': {
              borderColor: 'rgba(58, 69, 86, 0.6)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 217, 217, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00D9D9',
              boxShadow: `
                0 0 0 4px rgba(0, 217, 217, 0.15),
                0 0 20px rgba(0, 217, 217, 0.3),
                0 0 40px rgba(0, 217, 217, 0.15)
              `,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.7))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 217, 217, 0.1)',
          boxShadow: `
            0 2px 8px rgba(0, 0, 0, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.2)
          `,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.95), rgba(20, 25, 35, 0.9))',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 217, 217, 0.1)',
          boxShadow: `
            2px 0 16px rgba(0, 0, 0, 0.4),
            4px 0 32px rgba(0, 0, 0, 0.2)
          `,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(0, 217, 217, 0.1)',
          boxShadow: `
            0 2px 4px rgba(0, 0, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 8px 16px rgba(0, 0, 0, 0.2)
          `,
        },
      },
    },
  },
})
