# Component Showcase & Implementation Guide

## Overview
This guide demonstrates how to use the new premium components in your application.

---

## 1. StatsCard Component

### Purpose
Display key metrics with trends, progress, and icons in a premium card format.

### Props
```tsx
interface StatsCardProps {
  title: string              // Metric label
  value: string | number     // Main value to display
  unit?: string             // Unit suffix (e.g., "%", "/ 5.0")
  trend?: number            // Trend percentage (positive or negative)
  trendLabel?: string       // Trend context (e.g., "vs last quarter")
  icon?: React.ReactNode    // Icon component
  color?: string            // Primary color for card
  progress?: number         // Progress bar value (0-100)
  onClick?: () => void      // Click handler
}
```

### Basic Usage
```tsx
<StatsCard
  title="Total Employees"
  value={150}
  icon={<PeopleIcon />}
  color="#14B8A6"
/>
```

### With Trend
```tsx
<StatsCard
  title="Avg Performance Rating"
  value="4.25"
  unit="/ 5.0"
  icon={<BarChartIcon />}
  color="#3B82F6"
  trend={5}
  trendLabel="vs last quarter"
/>
```

### With Progress
```tsx
<StatsCard
  title="Review Completion"
  value={85}
  unit="%"
  icon={<CheckCircleIcon />}
  color="#10B981"
  progress={85}
/>
```

### Grid Layout Example
```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <StatsCard title="Metric 1" value={100} color="#14B8A6" />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <StatsCard title="Metric 2" value={200} color="#3B82F6" />
  </Grid>
  {/* More cards... */}
</Grid>
```

---

## 2. ChartCard Component

### Purpose
Container for charts, visualizations, and data displays with consistent styling.

### Props
```tsx
interface ChartCardProps {
  title: string                              // Card heading
  subtitle?: string                          // Optional subtitle
  children: React.ReactNode                  // Chart/content
  isLoading?: boolean                        // Loading state
  actions?: { label: string; onClick: () => void }[]  // Menu actions
}
```

### Basic Usage
```tsx
<ChartCard title="Performance Trends" subtitle="Last 30 days">
  {/* Chart component here */}
</ChartCard>
```

### With Actions Menu
```tsx
<ChartCard
  title="Department Reviews"
  subtitle="All active reviews"
  actions={[
    { label: 'Export', onClick: () => {} },
    { label: 'Filter', onClick: () => {} },
    { label: 'Settings', onClick: () => {} },
  ]}
>
  {/* Content here */}
</ChartCard>
```

### With Loading State
```tsx
<ChartCard title="Data" isLoading={true}>
  <Box sx={{ height: 300 }} />
</ChartCard>
```

---

## 3. Data Table with Dark Theme

### Styled Table Example
```tsx
<ChartCard title="Recent Reviews" subtitle={`${reviews.length} total`}>
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#334155', borderBottom: '1px solid #475569' }}>
          <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>
            Employee
          </TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>
            Rating
          </TableCell>
          <TableCell sx={{ fontWeight: 600, color: '#F1F5F9' }}>
            Status
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {reviews.map((review) => (
          <TableRow
            key={review.id}
            sx={{
              backgroundColor: '#1E293B',
              '&:hover': { backgroundColor: '#334155' },
              borderBottom: '1px solid #334155',
            }}
          >
            <TableCell sx={{ fontWeight: 500, color: '#F1F5F9' }}>
              {review.employeeName}
            </TableCell>
            <TableCell sx={{ color: '#CBD5E1' }}>
              {review.rating.toFixed(1)}
            </TableCell>
            <TableCell>
              <Chip
                label={review.status}
                size="small"
                sx={{
                  backgroundColor: '#10B98130',
                  color: '#10B981',
                  border: 'none',
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</ChartCard>
```

---

## 4. Development Plan Cards

### Grid Layout
```tsx
<ChartCard
  title="Active Development Plans"
  subtitle={`${plans.length} growth initiatives`}
>
  <Grid container spacing={2}>
    {plans.map((plan) => (
      <Grid item xs={12} sm={6} key={plan.id}>
        <Box
          sx={{
            p: 2.5,
            backgroundColor: '#334155',
            borderRadius: 1.5,
            border: '1px solid #475569',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#3F4A5E',
              borderColor: '#14B8A6',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: '#14B8A630',
                color: '#14B8A6',
                fontWeight: 700,
              }}
            >
              {plan.employeeName.charAt(0)}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: '#F1F5F9' }}
              >
                {plan.employeeName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#94A3B8' }}
              >
                {plan.title}
              </Typography>
            </Box>
          </Box>
          {/* Progress bars... */}
        </Box>
      </Grid>
    ))}
  </Grid>
</ChartCard>
```

---

## 5. Color Usage in Components

### Status Chip Colors
```tsx
// Success / Approved
<Chip
  label="Approved"
  sx={{
    backgroundColor: '#10B98130',  // 30% opacity
    color: '#10B981',
    border: 'none',
  }}
/>

// Info / Submitted
<Chip
  label="Submitted"
  sx={{
    backgroundColor: '#3B82F630',
    color: '#3B82F6',
    border: 'none',
  }}
/>

// Warning / Pending
<Chip
  label="Pending"
  sx={{
    backgroundColor: '#F59E0B30',
    color: '#F59E0B',
    border: 'none',
  }}
/>
```

### Rating Indicators
```tsx
// Rating color based on value
const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return '#10B981'  // Green
  if (rating >= 3.5) return '#14B8A6'  // Teal
  return '#F59E0B'                     // Amber
}

<Box
  sx={{
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: getRatingColor(review.rating),
  }}
/>
```

---

## 6. Progress Bars

### Simple Progress
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
      borderRadius: 3,
    },
  }}
/>
```

### With Label
```tsx
<Box>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
    <Typography variant="caption" sx={{ fontWeight: 500, color: '#CBD5E1' }}>
      Goal Title
    </Typography>
    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
      {progress}%
    </Typography>
  </Box>
  <LinearProgress variant="determinate" value={progress} sx={/* styles */} />
</Box>
```

---

## 7. Avatar Patterns

### Role-Based Avatar
```tsx
<Avatar
  sx={{
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
    fontSize: '0.9rem',
    fontWeight: 700,
  }}
>
  {user.name.charAt(0).toUpperCase()}
</Avatar>
```

### Plan Card Avatar
```tsx
<Avatar
  sx={{
    width: 40,
    height: 40,
    backgroundColor: '#14B8A630',
    color: '#14B8A6',
    fontWeight: 700,
  }}
>
  {name.charAt(0)}
</Avatar>
```

---

## 8. Button & Interaction States

### Primary Button
```tsx
<Button
  variant="contained"
  sx={{
    backgroundColor: '#14B8A6',
    '&:hover': {
      backgroundColor: '#0D9488',
    },
  }}
>
  Action
</Button>
```

### Text Button with Hover
```tsx
<Button
  variant="text"
  sx={{
    color: '#14B8A6',
    '&:hover': { backgroundColor: '#14B8A610' },
  }}
>
  View Details
</Button>
```

### Icon Button
```tsx
<IconButton
  sx={{
    color: '#94A3B8',
    '&:hover': { color: '#14B8A6' },
  }}
>
  <SearchIcon />
</IconButton>
```

---

## 9. Responsive Design Patterns

### Grid Breakdown
```tsx
// 4 columns on desktop, 2 on tablet, 1 on mobile
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <StatsCard {...props} />
  </Grid>
</Grid>
```

### Flexible Table
```tsx
<TableContainer>
  <Table sx={{
    // On mobile, hide less important columns
    '@media (max-width: 600px)': {
      '& th:nth-of-type(2)': { display: 'none' },
      '& td:nth-of-type(2)': { display: 'none' },
    },
  }}>
    {/* Table content */}
  </Table>
</TableContainer>
```

---

## 10. Loading & Empty States

### Loading Spinner
```tsx
{isLoading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress sx={{ color: '#14B8A6' }} />
  </Box>
) : (
  {/* Content */}
)}
```

### Empty State
```tsx
<Box sx={{
  p: 4,
  textAlign: 'center',
  backgroundColor: '#334155',
  borderRadius: 2,
  border: '1px solid #475569',
}}>
  <Typography sx={{ color: '#94A3B8', mb: 1 }}>
    No data available
  </Typography>
  <Typography variant="caption" sx={{ color: '#475569' }}>
    Check back later or adjust your filters
  </Typography>
</Box>
```

---

## Common Implementation Patterns

### 1. Metric Grid
```tsx
<Grid container spacing={3} sx={{ mb: 4 }}>
  {metrics.map((metric) => (
    <Grid item xs={12} sm={6} md={3} key={metric.id}>
      <StatsCard {...metric} />
    </Grid>
  ))}
</Grid>
```

### 2. Data Table with Actions
```tsx
<ChartCard title={title} subtitle={subtitle}>
  <TableContainer>
    <Table>
      {/* Header and body rows with action buttons */}
    </Table>
  </TableContainer>
</ChartCard>
```

### 3. Dashboard Layout
```tsx
<Box>
  {/* Header */}
  <Box sx={{ mb: 4 }}>
    <Typography variant="h3" sx={{ fontWeight: 700, color: '#F1F5F9' }}>
      Dashboard Title
    </Typography>
  </Box>

  {/* Key Metrics */}
  <Grid container spacing={3} sx={{ mb: 4 }}>
    {/* StatsCard components */}
  </Grid>

  {/* Data Sections */}
  <ChartCard title="Section Title">
    {/* Content */}
  </ChartCard>
</Box>
```

---

## Best Practices

1. **Consistency**: Use the same colors and spacing throughout
2. **Accessibility**: Maintain contrast ratios (min 4.5:1 for text)
3. **Responsive**: Test on mobile, tablet, and desktop
4. **Performance**: Memoize heavy components, lazy load tables
5. **Loading**: Always show loading states for async operations
6. **Feedback**: Provide visual feedback for all interactions
7. **Documentation**: Document custom component props

---

## Troubleshooting

### Cards not showing properly?
- Check if StatsCard/ChartCard are imported
- Verify color values are valid hex codes
- Ensure spacing values are in MUI spacing units

### Table text hard to read?
- Check color contrast (should be 4.5:1 minimum)
- Increase fontWeight for headers
- Ensure background is #1E293B or darker

### Hover effects not working?
- Check CSS specificity (use `&:hover` syntax)
- Ensure transition property is defined
- Test in different browsers

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready for Implementation
