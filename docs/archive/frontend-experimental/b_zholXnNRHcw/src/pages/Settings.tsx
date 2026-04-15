import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { useSnackbar } from '@/contexts/SnackbarContext'

export const Settings: React.FC = () => {
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    performanceAlerts: true,
    weeklyReports: false,
    theme: 'light',
  })

  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  })

  const handleSaveProfile = () => {
    showSnackbar('Profile updated successfully', 'success')
    setIsEditing(false)
  }

  const handleSaveSettings = () => {
    showSnackbar('Settings saved successfully', 'success')
  }

  return (
    <Box>
      <Typography variant="h3" sx={{ fontWeight: 700, color: '#102A43', mb: 4 }}>
        Settings
      </Typography>

      {/* Profile Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
              Profile Information
            </Typography>
            <Button
              variant={isEditing ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department"
                value={profileData.department}
                onChange={(e) =>
                  setProfileData({ ...profileData, department: e.target.value })
                }
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43' }}>
              Notification Preferences
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSaveSettings}
            >
              Save Preferences
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Email Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Receive email updates on performance reviews and approvals
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.performanceAlerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      performanceAlerts: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Performance Alerts
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Get notified about review deadlines and goal milestones
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.weeklyReports}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      weeklyReports: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Weekly Reports
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    Receive weekly summary of team performance metrics
                  </Typography>
                </Box>
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#102A43', mb: 3 }}>
            System Preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Application Version
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                v1.0.0
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                2024-04-15
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
