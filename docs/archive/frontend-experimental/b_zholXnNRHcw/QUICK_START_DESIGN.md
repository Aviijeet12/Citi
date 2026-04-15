# Quick Start - Design & Components Guide

## 🎨 Color Palette Quick Reference

### Copy-Paste Colors
```
Brand Teal:     #14B8A6
Dark Teal:      #0F766E
Background:     #0F172A
Surface:        #1E293B
Border:         #475569
Text Primary:   #F1F5F9
Text Secondary: #CBD5E1
Text Muted:     #94A3B8
Success:        #10B981
Warning:        #F59E0B
Error:          #EF4444
Info:           #3B82F6
```

---

## 🧱 Component Quick Usage

### StatsCard
```tsx
import { StatsCard } from '@/components/analytics/StatsCard'

<StatsCard
  title="Employees"
  value={150}
  icon={<PeopleIcon />}
  color="#14B8A6"
/>
```

### ChartCard
```tsx
import { ChartCard } from '@/components/analytics/ChartCard'

<ChartCard title="Reviews" subtitle="All departments">
  {/* Your chart/table here */}
</ChartCard>
```

---

## 📱 Grid Breakpoints

```
xs: 0-599px    (mobile)
sm: 600-959px  (tablet)
md: 960-1279px (desktop)
lg: 1280px+    (large)
```

### Standard Grid
```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    Content
  </Grid>
</Grid>
```

---

## 🎯 Common Styling Patterns

### Card with Hover Effect
```tsx
<Card sx={{
  background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
  border: '1px solid #475569',
  p: 3,
  '&:hover': {
    borderColor: '#14B8A6',
    boxShadow: '0 12px 24px #14B8A630',
  }
}}>
```

### Text Colors
```tsx
<Typography sx={{ color: '#F1F5F9' }}>Primary Text</Typography>
<Typography sx={{ color: '#CBD5E1' }}>Secondary Text</Typography>
<Typography sx={{ color: '#94A3B8' }}>Muted Text</Typography>
```

### Status Chip
```tsx
<Chip
  label="Status"
  sx={{
    backgroundColor: '#10B98130',
    color: '#10B981',
    border: 'none',
  }}
/>
```

---

## 🎬 Common Animations

### Smooth Transition
```tsx
sx={{ transition: 'all 0.3s ease' }}
```

### Hover Lift
```tsx
sx={{
  transition: 'all 0.3s ease',
  '&:hover': { transform: 'translateY(-4px)' }
}}
```

### Color Shift
```tsx
sx={{
  color: '#94A3B8',
  transition: 'color 0.2s ease',
  '&:hover': { color: '#14B8A6' }
}}
```

---

## 📊 Table Styling

### Header Row
```tsx
<TableRow sx={{ backgroundColor: '#334155' }}>
  <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>
    Column
  </TableCell>
</TableRow>
```

### Data Row
```tsx
<TableRow sx={{
  backgroundColor: '#1E293B',
  '&:hover': { backgroundColor: '#334155' },
  borderBottom: '1px solid #334155'
}}>
  <TableCell sx={{ color: '#F1F5F9' }}>Data</TableCell>
</TableRow>
```

---

## 👤 Avatar Patterns

### User Avatar
```tsx
<Avatar sx={{
  background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
  fontWeight: 700,
}}>
  {user.name.charAt(0)}
</Avatar>
```

### Role Avatar
```tsx
<Avatar sx={{
  backgroundColor: '#14B8A630',
  color: '#14B8A6',
  fontWeight: 700,
}}>
  A
</Avatar>
```

---

## 📈 Progress Bars

### Simple
```tsx
<LinearProgress
  variant="determinate"
  value={85}
  sx={{
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #14B8A6, #06B6D4)',
    },
  }}
/>
```

---

## 🔘 Buttons

### Primary
```tsx
<Button sx={{
  backgroundColor: '#14B8A6',
  '&:hover': { backgroundColor: '#0D9488' }
}}>
  Action
</Button>
```

### Text
```tsx
<Button sx={{
  color: '#14B8A6',
  '&:hover': { backgroundColor: '#14B8A610' }
}}>
  Link
</Button>
```

### Icon
```tsx
<IconButton sx={{
  color: '#94A3B8',
  '&:hover': { color: '#14B8A6' }
}}>
  <Icon />
</IconButton>
```

---

## 📐 Spacing

```
p: 3         = 12px padding
px: 2        = 8px horizontal
py: 1.5      = 6px vertical
mb: 4        = 16px margin-bottom
gap: 3       = 12px gap
```

---

## 🎭 Role Badge Colors

```tsx
// Admin
backgroundColor: '#0F766E30', color: '#14B8A6'

// Manager
backgroundColor: '#06B6D430', color: '#06B6D4'

// Employee
backgroundColor: '#F59E0B30', color: '#F59E0B'
```

---

## 💡 Pro Tips

1. **Use CSS Variables** - Store colors as variables for consistency
2. **Responsive First** - Design mobile, then enhance
3. **Contrast Check** - Text should be 4.5:1 or higher
4. **Consistent Spacing** - Use MUI spacing units (2, 3, 4, etc)
5. **Hover States** - Add feedback to all interactive elements
6. **Loading States** - Show progress during async operations
7. **Error Handling** - Use error color (#EF4444) for alerts

---

## 🚀 Quick Implementation

### 1. New Dashboard
```tsx
import { StatsCard } from '@/components/analytics/StatsCard'
import { ChartCard } from '@/components/analytics/ChartCard'

export const MyDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" sx={{ color: '#F1F5F9', mb: 4 }}>
        Dashboard Title
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Metric"
            value={100}
            color="#14B8A6"
          />
        </Grid>
      </Grid>

      <ChartCard title="Data" subtitle="Details">
        {/* Content */}
      </ChartCard>
    </Box>
  )
}
```

### 2. Update Existing Component
```tsx
// Change this:
sx={{ color: '#000' }}

// To this:
sx={{ color: '#F1F5F9' }}

// And this:
sx={{ backgroundColor: '#FFF' }}

// To this:
sx={{ backgroundColor: '#1E293B' }}
```

---

## 📚 Full Documentation

- **DESIGN_TOKENS.md** - Complete design system
- **COMPONENT_SHOWCASE.md** - Detailed examples
- **UI_UPGRADE_SUMMARY.md** - What changed and why
- **FRONTEND_ENHANCEMENT_COMPLETE.md** - Full overview

---

## ✅ Checklist for New Components

- [ ] Use dark theme colors
- [ ] Add hover effects
- [ ] Include loading states
- [ ] Make responsive (xs, sm, md)
- [ ] Test contrast ratios
- [ ] Add smooth transitions
- [ ] Include proper spacing
- [ ] Use semantic colors
- [ ] Document prop types

---

**Theme**: Premium Dark  
**Colors**: 14 main colors  
**Components**: 2 reusable + Layout  
**Status**: Production Ready ✅

