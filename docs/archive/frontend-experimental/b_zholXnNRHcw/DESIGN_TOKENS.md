# Design Tokens & Color Palette

## CSS Variables Reference

All design tokens are defined in `src/index.css` and available throughout the application as CSS variables.

### Usage Example
```css
background-color: var(--color-bg-dark);
color: var(--color-text-primary);
border-color: var(--color-border);
```

---

## Color Palette

### Primary Brand Colors
```
Primary Brand Teal:     #14B8A6  (Interactive, hover, active states)
Dark Teal:              #0F766E  (Headers, badges, accents)
Light Teal:             #06B6D4  (Secondary accent)
```

### Background Colors
```
Main Background:        #0F172A  (Primary page background)
Secondary Background:   #1E293B  (Cards, surfaces)
Tertiary Background:    #334155  (Hover states, contrast)
Surface:                #1F2937  (Alternative surface)
Border:                 #475569  (Borders, dividers)
```

### Text Colors
```
Primary Text:           #F1F5F9  (Main content text)
Secondary Text:         #CBD5E1  (Subtext, labels)
Muted Text:             #94A3B8  (Disabled, hints)
```

### Semantic Colors
```
Success:                #10B981  (Approved, positive)
Warning:                #F59E0B  (Pending, attention)
Error:                  #EF4444  (Failed, negative)
Info:                   #3B82F6  (Information, neutral)
```

---

## Component Examples

### Stats Card Gradient
```
Top-left:    #1E293B (secondary bg)
Bottom-right: #334155 (tertiary bg)
Top border:   Linear gradient to color-primary-light
```

### Chart Card
```
Background: Linear gradient #1E293B → #334155
Border: 1px solid #475569
Text: color-text-primary (#F1F5F9)
```

### Button States
- **Default**: color-primary-light (#14B8A6)
- **Hover**: Lighten 10% with box-shadow
- **Active**: Darken 10%
- **Disabled**: color-muted (#94A3B8)

### Badge Colors by Role
```
Admin:      Background: #0F766E30, Text: #14B8A6
Manager:    Background: #06B6D430, Text: #06B6D4
Employee:   Background: #F59E0B30, Text: #F59E0B
```

---

## Typography

### Font Stack
```
System: -apple-system, BlinkMacSystemFont, 'Segoe UI'
Fallback: 'Source Sans 3', sans-serif
```

### Text Sizes & Weights
```
h1, h2, h3: fontWeight: 700, fontFamily: Poppins
h4, h5, h6: fontWeight: 700
body: fontWeight: 400-500
```

---

## Spacing Scale

```
0   = 0px
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
```

### Common Spacing Patterns
```
Card padding: p: 3 (12px)
Section margin: mb: 4 (16px)
Gap between elements: gap: 2 (8px)
Button padding: py: 1.5, px: 2
```

---

## Border Radius

```
None:       borderRadius: 0
Small:      borderRadius: 0.5 (2px)
Medium:     borderRadius: 1 (4px)
Large:      borderRadius: 1.5 (6px)
Full:       borderRadius: '50%'
Card:       borderRadius: 2 (8px)
```

---

## Shadows

### Elevation Levels
```
Level 0 (None):     boxShadow: 'none'
Level 1 (Subtle):   boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
Level 2 (Small):    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
Level 3 (Medium):   boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
Level 4 (Large):    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
```

### Hover Shadow
```
Color-specific glow: boxShadow: `0 12px 24px ${color}30`
```

---

## Transitions & Animations

### Timing
```
Quick:      0.2s
Default:    0.3s ease
Slow:       0.5s ease
```

### Easing Functions
```
Linear:      ease-linear
Ease-in:     ease-in
Ease-out:    ease-out
Ease-in-out: ease-in-out
Cubic:       cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations
```
Hover lift:     transform: translateY(-4px)
Color shift:    background-color: 0.2s ease
Border glow:    border-color change with shadow
```

---

## Breakpoints (MUI Standard)

```
xs: 0px       (mobile)
sm: 600px     (tablet)
md: 960px     (desktop)
lg: 1280px    (large desktop)
xl: 1920px    (wide screen)
```

---

## Interactive Elements

### Buttons
- **Variant**: contained, outlined, text
- **Colors**: primary, secondary, success, warning, error
- **Sizes**: small, medium, large
- **States**: default, hover, active, disabled, loading

### Chips
- **Background**: Color with 30% opacity (e.g., #10B98130)
- **Text**: Matching color (e.g., #10B981)
- **Border**: None (filled style)
- **Size**: small

### Tables
- **Header Background**: #334155
- **Row Background**: #1E293B
- **Hover**: #334155 (darker on hover)
- **Border**: 1px solid #334155
- **Text**: color-text-primary (#F1F5F9)

---

## Component-Specific Tokens

### StatsCard
```
Border top: 3px solid [color]
Background: linear-gradient(135deg, #1E293B 0%, #334155 100%)
Border: 1px solid #475569
Hover: border-color: [color], boxShadow: 0 12px 24px [color]30
```

### ChartCard
```
Background: linear-gradient(135deg, #1E293B 0%, #334155 100%)
Border: 1px solid #475569
Heading: color-text-primary, fontWeight: 700
Subtitle: color-muted
```

### Avatar
```
Size: 40px (small), 36px (tiny)
Background: [color]30 (30% opacity)
Color: [color]
Font: fontWeight: 700
```

---

## Accessibility Notes

1. **Contrast Ratios**:
   - Primary text on background: 10.5:1 (AAA+)
   - Secondary text on background: 8.2:1 (AAA)
   - Muted text on background: 5.8:1 (AA)

2. **Color Blind Friendly**:
   - Teal + Red/Green alternatives provided
   - Icons + colors (not color-only indicators)
   - High luminance contrast maintained

3. **Focus States**:
   - Outline: 2px solid color-primary-light
   - Offset: 2px

---

## Implementation Guide

### Using CSS Variables
```tsx
<Box sx={{ color: 'var(--color-text-primary)' }}>
  Text with primary color
</Box>
```

### Using MUI Theme Props
```tsx
<Typography sx={{ color: '#F1F5F9' }}>
  Hardcoded for specific needs
</Typography>
```

### Gradient Patterns
```
Linear (h): linear-gradient(90deg, color1, color2)
Linear (v): linear-gradient(135deg, color1 0%, color2 100%)
Radial: radial-gradient(circle, color1, color2)
```

---

**Last Updated**: 2024
**Version**: 1.0 - Premium Dark Theme
**Status**: Production Ready
