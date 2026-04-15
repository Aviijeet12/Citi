import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  AssignmentInd as ReviewIcon,
  BookmarkAdded as PlanIcon,
  School as TrainingIcon,
  Psychology as CompetencyIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types'
import { getRoleDisplayName } from '@/utils/rolePermissions'

const DRAWER_WIDTH = 260

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'manager', 'employee'] },
  { label: 'Performance Reviews', icon: <ReviewIcon />, path: '/reviews', roles: ['admin', 'manager', 'employee'] },
  { label: 'Development Plans', icon: <PlanIcon />, path: '/plans', roles: ['admin', 'manager', 'employee'] },
  { label: 'Competencies', icon: <CompetencyIcon />, path: '/competencies', roles: ['admin', 'manager', 'employee'] },
  { label: 'Training Records', icon: <TrainingIcon />, path: '/training', roles: ['admin', 'manager', 'employee'] },
]

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
    navigate('/login')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
        onClick={() => handleNavigation('/dashboard')}
      >
        PS
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
        Performance Studio
      </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          // Show nav item only if user's role is in the allowed roles
          if (item.roles && user && !item.roles.includes(user.role)) {
            return null
          }
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                px: 2,
                color: '#7A8699',
                margin: '0.25rem 0.5rem',
                borderRadius: '8px',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#2A3142',
                  color: '#00D9D9',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'inherit',
                }}
              />
            </ListItemButton>
          )
        })}
      </List>
      <Divider sx={{ borderColor: '#3A4556' }} />
      <Box sx={{ p: 2 }}>
        {user && (
          <>
            <Box sx={{ mb: 1.5, display: 'inline-block' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  backgroundColor:
                    user.role === 'admin'
                      ? '#00D9D915'
                      : user.role === 'manager'
                      ? '#0066FF15'
                      : '#FF8A0015',
                  color:
                    user.role === 'admin'
                      ? '#00D9D9'
                      : user.role === 'manager'
                      ? '#4D94FF'
                      : '#FFB84D',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {getRoleDisplayName(user.role)}
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#7A8699', display: 'block', mb: 1 }}>
              {user?.department}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              {user?.name}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          background: `linear-gradient(135deg, rgba(30, 38, 51, 0.85), rgba(26, 31, 46, 0.75))`,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 217, 217, 0.1)',
          boxShadow: `
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 4px 16px rgba(0, 0, 0, 0.3),
            0 0 30px rgba(0, 217, 217, 0.05)
          `,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#00D9D9' }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.5px' }}>
              Performance Studio
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="small"
              onClick={() => navigate('/search')}
              sx={{ color: '#7A8699', '&:hover': { color: '#00D9D9' } }}
            >
              <SearchIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                p: 0.5,
                border: '2px solid rgba(0, 217, 217, 0.3)',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#00D9D9',
                  boxShadow: `0 4px 12px rgba(0, 217, 217, 0.3)`,
                  transform: 'translateZ(8px)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #00D9D9, #4FE5E5)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0F1419',
                  boxShadow: `
                    0 2px 8px rgba(0, 217, 217, 0.3),
                    0 4px 12px rgba(0, 217, 217, 0.2)
                  `,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                background: '#1E2633',
                border: '1px solid #3A4556',
                '& .MuiMenuItem-root': {
                  color: '#FFFFFF',
                  '&:hover': { backgroundColor: '#2A3142' },
                },
                '& .MuiDivider-root': { borderColor: '#3A4556' },
              },
            }}
          >
            <MenuItem disabled sx={{ pointerEvents: 'none' }}>
              <ListItemIcon sx={{ color: '#7A8699' }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <span>{user?.email}</span>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
              <ListItemIcon sx={{ color: '#7A8699' }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon sx={{ color: '#FF6B6B' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
            <Box />
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              background: `linear-gradient(180deg, rgba(26, 31, 46, 0.95), rgba(20, 25, 35, 0.9))`,
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(0, 217, 217, 0.1)',
              boxShadow: `
                2px 0 16px rgba(0, 0, 0, 0.4),
                4px 0 32px rgba(0, 0, 0, 0.2)
              `,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: '#0F1419',
          mt: { xs: 7, sm: 8 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
