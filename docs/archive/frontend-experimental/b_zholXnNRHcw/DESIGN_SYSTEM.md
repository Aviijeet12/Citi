# Performance Studio - Design System Guide

## 🎨 Complete Design System

A professional, cohesive visual language built for enterprise HR software.

---

## 🌈 Color Palette

### Primary Colors
```
Primary Teal      #0D9488    → Brand color, main CTAs, primary actions
Secondary Purple  #7C3AED    → Accents, secondary actions, highlights
Tertiary Blue     #2563EB    → Information, alternate actions
```

### Status Colors
```
Success Green     #059669    → Positive actions, completed states, success feedback
Warning Amber     #D97706    → Attention needed, warnings, pending states
Error Red         #DC2626    → Critical issues, destructive actions, errors
```

### Neutral Colors
```
Text Primary      #000000    → Main text content
Text Secondary    #374151    → Supporting text
Text Muted        #6B7280    → Disabled or subtle text
Text Tertiary     #9CA3AF    → Very subtle text

Background       #FFFFFF    → Main background
Surface          #F9FAFB    → Card/panel backgrounds
Border           #E5E7EB    → Borders and dividers
```

### Light Theme Variants
```
Primary-50       #F0FDFA    → Hover states, light backgrounds
Primary-100      #CCFBF1    → Subtle backgrounds
Primary-200      #99F6E4    → Mid-tone backgrounds

Secondary-50     #F3E8FF    → Hover states, light backgrounds
Secondary-100    #E9D5FF    → Subtle backgrounds

Tertiary-50      #EFF6FF    → Hover states, light backgrounds
Tertiary-100     #DBEAFE    → Subtle backgrounds

Success-50       #ECFDF5    → Success backgrounds
Warning-50       #FFFBEB    → Warning backgrounds
Error-50         #FEF2F2    → Error backgrounds
Info-50          #F0F9FF    → Info backgrounds
```

---

## 📏 Spacing Scale

### Standard Spacing
```
0.25 rem  (4px)    → Minimal spacing, compact UI
0.5 rem   (8px)    → Tight spacing, related elements
0.75 rem  (12px)   → Normal spacing, component padding
1 rem     (16px)   → Regular spacing, section padding
1.5 rem   (24px)   → Large spacing, major sections
2 rem     (32px)   → Extra large spacing, page sections
2.5 rem   (40px)   → Xlarge spacing, major divisions
3 rem     (48px)   → Xxlarge spacing, layout spacing
```

### Component Spacing
```
Cards          → padding: 24px (1.5 rem)
Sections       → margin-bottom: 24px
Inputs         → gap: 8px vertical, 12px horizontal
Lists          → gap: 12px between items
```

---

## 🔤 Typography System

### Font Family
```
Heading Font     → -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Body Font        → -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Mono Font        → monospace (for code)
```

### Type Scales
```
h1               → 32px, 700 weight, line-height 1.2
h2               → 28px, 700 weight, line-height 1.3
h3               → 24px, 700 weight, line-height 1.4
h4               → 20px, 700 weight, line-height 1.4
h5               → 18px, 700 weight, line-height 1.5
h6               → 16px, 700 weight, line-height 1.5
body1            → 16px, 400 weight, line-height 1.6
body2            → 14px, 400 weight, line-height 1.6
subtitle1        → 16px, 600 weight, line-height 1.5
subtitle2        → 14px, 600 weight, line-height 1.5
caption          → 12px, 400 weight, line-height 1.4
button           → 14px, 600 weight, text-transform: none
```

### Font Weights
```
Regular          → 400
Medium           → 500
Semibold         → 600
Bold             → 700
```

---

## 🎯 Component Styles

### Cards
```
Border Radius    → 12px
Padding          → 24px (1.5 rem)
Border           → 1px solid #E5E7EB
Background       → #FFFFFF
Shadow           → 0 1px 3px rgba(0,0,0,0.05)
Hover Shadow     → 0 8px 24px rgba(color,0.15)
Transition       → all 0.3s ease
```

### Buttons
```
Primary Button   → background: linear-gradient(135deg, #0D9488, #0D9488)
                   color: white
                   padding: 10px 16px
                   border-radius: 6px
                   font-weight: 600
                   
Secondary Button → background: transparent
                   border: 1px solid #E5E7EB
                   color: #0D9488
                   
Disabled Button  → opacity: 0.5
                   cursor: not-allowed
```

### Input Fields
```
Border Radius    → 6px
Padding          → 10px 12px
Border           → 1px solid #E5E7EB
Background       → #FFFFFF
Focus Border     → #0D9488
Placeholder      → #9CA3AF
```

### Progress Bars
```
Height           → 6px
Border Radius    → 3px
Background       → #E5E7EB
Progress Color   → linear-gradient(90deg, #0D9488, #7C3AED)
```

### Chips/Badges
```
Padding          → 8px 12px
Border Radius    → 6px
Font Size        → 12px (caption)
Font Weight      → 600
Success Color    → background: #ECFDF5, color: #059669
Warning Color    → background: #FFFBEB, color: #D97706
Error Color      → background: #FEF2F2, color: #DC2626
Info Color       → background: #F0F9FF, color: #2563EB
```

### Alerts
```
Padding          → 12px 16px
Border Radius    → 6px
Border           → 1px solid (color-specific)
Background       → color-50
Icon Color       → color
Text Color       → color
```

---

## 🎬 Interactions & Animations

### Transitions
```
Default          → transition: background-color 0.2s ease, color 0.2s ease
Hover            → transform: translateY(-2px)
Active           → opacity: 0.8
Disabled         → pointer-events: none, opacity: 0.5
```

### Hover States
```
Cards            → Border color to primary, shadow increase
Buttons          → Darker background, shadow increase
Links            → Color change, underline
Inputs           → Border color to primary
```

### Loading States
```
Spinner          → Rotating animation, primary color
Skeleton         → Pulsing animation at 1s intervals
Disabled State   → Greyed out, cursor not-allowed
```

---

## 📐 Layout Patterns

### Grid Layouts
```
2 Column (mobile)    → xs: 1, md: 2
3 Column (tablet)    → xs: 1, md: 2, lg: 3
4 Column (desktop)   → xs: 1, md: 2, lg: 3, xl: 4
```

### Common Breakpoints
```
xs: 0px (Mobile)
sm: 600px (Tablet)
md: 960px (Small Desktop)
lg: 1280px (Desktop)
xl: 1920px (Large Desktop)
```

### Card Grid Spacing
```
Gap              → 24px (1.5 rem)
Padding          → 16px 24px (2.5 rem)
Item Min-Width   → 300px (responsive)
```

---

## 🎨 Component Examples

### Stats Card Layout
```
┌─────────────────────────┐
│ [Icon] Section Title    │
│                         │
│ Large Number    Unit    │
│ ↑ 5% vs last month      │
│                         │
│ ▓▓▓▓▓░░░░  50% Progress │
└─────────────────────────┘
```

### Employee Card Layout
```
┌──────────────────────────────┐
│ [Avatar] Name                │
│          Job Title           │
│ [Status Badge]               │
│                              │
│ Email: email@company.com     │
│ Dept:  Engineering           │
│ Mgr:   John Doe              │
│                              │
│ [Edit] [View Profile]        │
└──────────────────────────────┘
```

### Section Header Layout
```
[Icon] Section Title          [Action Button]
       Subtitle description
```

### Permission Matrix Layout
```
┌──────────────────┬───────┬─────────┬──────────┐
│ Permission       │ Admin │ Manager │ Employee │
├──────────────────┼───────┼─────────┼──────────┤
│ Action Name      │ ✅    │ ✅      │ ❌       │
│ Description      │ ✅    │ ❌      │ ✅       │
└──────────────────┴───────┴─────────┴──────────┘
```

---

## 🔄 Responsive Behavior

### Mobile (xs < 600px)
- Single column layouts
- Full-width cards
- Stacked navigation
- Bottom sheets for modals
- Larger touch targets (44px minimum)

### Tablet (sm: 600px - 960px)
- 2 column grids
- Side-by-side layouts
- Standard navigation
- Desktop modals

### Desktop (md: 960px+)
- 3-4 column grids
- Full layouts
- Complex grids
- Standard interactions

---

## ♿ Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus States
```
Focus outline    → 2px solid primary color
Focus offset     → 2px
Focus radius     → 4px
```

### ARIA Labels
```html
<Button aria-label="Edit employee">
<Icon aria-hidden="true" />
<Input aria-label="Search employees" />
<Alert role="alert">Error message</Alert>
```

---

## 📦 CSS Variables

### All Available Variables
```css
/* Colors */
--color-primary
--color-secondary
--color-tertiary
--color-success
--color-warning
--color-error
--color-info

/* Text Colors */
--color-text-primary
--color-text-secondary
--color-text-muted
--color-text-tertiary

/* Backgrounds */
--color-background
--color-surface
--color-border

/* Gradients */
--gradient-primary
--gradient-secondary
--gradient-accent

/* Light Variants */
--color-primary-50
--color-secondary-50
--color-success-50
--color-warning-50
--color-error-50
--color-info-50
```

---

## 🎭 Dark Mode (Future)

Prepared for dark mode implementation:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-surface: #2a2a2a;
    --color-text-primary: #ffffff;
    --color-border: #404040;
  }
}
```

---

## 🖼️ Icon Guidelines

### Icon Sizing
```
Small (16px)     → Lists, compact views, inline
Medium (20px)    → Headers, buttons, standard UI
Large (24px)     → Hero sections, prominent actions
XLarge (32px+)   → Feature displays, hero images
```

### Icon Style
```
Fill Style       → Solid filled icons
Weight           → Consistent stroke weight (2px)
Color            → Match text color or primary color
```

### Icon Usage
```
Buttons          → 16-20px, same color as text
Headers          → 20-24px, primary color
Stats            → 24-32px, brand color
Sections         → 24px, primary color
```

---

## 📐 Border & Radius Guidelines

### Border Radius
```
Minimal (4px)    → Small UI elements, subtle curves
Normal (6px)     → Buttons, inputs, small cards
Medium (8px)     → Component containers
Large (12px)     → Main cards, larger components
Full (50%)       → Circles, avatars
```

### Border Styles
```
Primary          → 1px solid #E5E7EB
Hover            → 1px solid primary color
Focus            → 2px solid primary color
Accent           → 2px solid primary color
```

---

## 🎯 Consistency Checklist

When creating new components:
- [ ] Use CSS variables for colors
- [ ] Use spacing scale for padding/margins
- [ ] Use defined typography scale
- [ ] Add focus states
- [ ] Add hover states
- [ ] Test on mobile
- [ ] Check color contrast
- [ ] Add ARIA labels
- [ ] Test with keyboard navigation
- [ ] Add loading states

---

## 🚀 Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Radius | 12px | Main cards |
| Padding | 24px | Card content |
| Gap | 24px | Grid spacing |
| Transition | 0.3s | All animations |
| Shadow | 0 1px 3px | Standard shadow |
| Border | 1px | Standard borders |
| Font Size | 16px | Body text |
| Line Height | 1.6 | Text readability |

---

**This design system ensures consistency, professionalism, and a cohesive user experience across the entire application.**
