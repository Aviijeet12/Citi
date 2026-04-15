# RBAC Quick Reference Guide

## Common Tasks

### Check User's Role
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, hasRole } = useAuth()
  
  if (hasRole('admin')) {
    // Show admin content
  }
  
  if (hasRole(['admin', 'manager'])) {
    // Show admin or manager content
  }
}
```

### Check User's Permission
```tsx
import { hasPermission } from '@/utils/rolePermissions'
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user } = useAuth()
  
  if (user && hasPermission(user.role, 'manage_reviews')) {
    // Show review management button
  }
}
```

### Filter Data for User
```tsx
import { filterPerformanceReviews } from '@/utils/dataFilters'
import { useAuth } from '@/contexts/AuthContext'

function ReviewsList() {
  const { user } = useAuth()
  const accessibleReviews = filterPerformanceReviews(allReviews, user)
  
  return (
    <Table>
      {accessibleReviews.map(review => (
        <TableRow key={review.id}>{/* ... */}</TableRow>
      ))}
    </Table>
  )
}
```

### Protect a Route
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ReviewsPage } from '@/pages/Reviews'

function App() {
  return (
    <Routes>
      {/* Role-based protection */}
      <Route
        path="/reviews"
        element={
          <ProtectedRoute requiredRole={['admin', 'manager']}>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Permission-based protection */}
      <Route
        path="/competencies/manage"
        element={
          <ProtectedRoute requiredPermission="manage_competencies">
            <CompetencyManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
```

### Login User
```tsx
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const { login } = useAuth()
  
  const handleLogin = async () => {
    try {
      await login('user@company.com', 'password')
      // Navigate to dashboard
    } catch (error) {
      // Show error
    }
  }
}
```

### Login with OAuth
```tsx
import { useAuth } from '@/contexts/AuthContext'

function OAuthButtons() {
  const { loginWithGoogle, loginWithGitHub } = useAuth()
  
  return (
    <>
      <Button onClick={() => loginWithGoogle('token')}>
        Login with Google
      </Button>
      <Button onClick={() => loginWithGitHub('token')}>
        Login with GitHub
      </Button>
    </>
  )
}
```

### Check Resource Access
```tsx
import { getResourcePermissions } from '@/utils/dataFilters'
import { useAuth } from '@/contexts/AuthContext'

function ReviewActions({ reviewId, ownerId }) {
  const { user } = useAuth()
  
  if (!user) return null
  
  const isOwnReview = user.id === ownerId
  const permissions = getResourcePermissions(
    user.role,
    user.id,
    ownerId,
    isOwnReview
  )
  
  return (
    <>
      {permissions.canView && <Button>View</Button>}
      {permissions.canEdit && <Button>Edit</Button>}
      {permissions.canApprove && <Button>Approve</Button>}
    </>
  )
}
```

### Get User-Friendly Role Name
```tsx
import { getRoleDisplayName } from '@/utils/rolePermissions'

const displayName = getRoleDisplayName('admin')
// Returns: 'HR Administrator'
```

## Permission Types

```typescript
type Permission = 
  | 'manage_all_employees'      // Admin only
  | 'manage_team_members'       // Manager only
  | 'manage_reviews'            // Admin & Manager
  | 'view_reviews'              // All roles
  | 'manage_competencies'       // Admin only
  | 'manage_training'           // Admin only
  | 'manage_development_plans'  // Admin & Manager
  | 'view_organization_analytics' // Admin only
  | 'view_team_analytics'       // Manager only
  | 'view_own_profile'          // All roles
  | 'edit_own_goals'            // Employee only
```

## Role Definitions

### Admin (HR Administrator)
```typescript
Permissions: [
  'manage_all_employees',
  'manage_reviews',
  'manage_competencies',
  'manage_training',
  'manage_development_plans',
  'view_organization_analytics',
]
```

### Manager
```typescript
Permissions: [
  'manage_team_members',
  'manage_reviews',
  'manage_development_plans',
  'view_team_analytics',
]
```

### Employee
```typescript
Permissions: [
  'view_own_profile',
  'view_reviews',
  'edit_own_goals',
]
```

## Hook Reference

### useAuth()
```typescript
const {
  user: User | null,              // Current user object
  token: string | null,           // JWT token
  isLoading: boolean,             // Loading state
  error: string | null,           // Error message
  login: (email, password) => Promise<void>,
  loginWithGoogle: (token) => Promise<void>,
  loginWithGitHub: (token) => Promise<void>,
  logout: () => void,
  hasRole: (role | role[]) => boolean,
} = useAuth()
```

## User Object
```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  department: string
  avatar?: string
  authProvider?: 'credentials' | 'google' | 'github'
  createdAt?: string
}
```

## Common Patterns

### Conditional Rendering Based on Role
```tsx
{user?.role === 'admin' && <AdminPanel />}
{user?.role === 'manager' && <ManagerPanel />}
{user?.role === 'employee' && <EmployeePanel />}
```

### Show Button Based on Permission
```tsx
{hasPermission(user.role, 'manage_reviews') && (
  <Button onClick={createReview}>Create Review</Button>
)}
```

### Filter Navigation Items
```tsx
const visibleItems = navItems.filter(item =>
  !item.roles || item.roles.includes(user?.role)
)
```

### Show Alert for Pending Actions
```tsx
{user?.role === 'manager' && pendingReviews.length > 0 && (
  <Alert>You have {pendingReviews.length} pending reviews</Alert>
)}
```

## Testing

### Test Admin Access
1. Login: admin@company.com / password
2. Verify: Can see all employees, reviews, and settings
3. Check: All navigation items visible

### Test Manager Access
1. Login: manager@company.com / password
2. Verify: Only sees team member data
3. Check: Limited navigation

### Test Employee Access
1. Login: employee@company.com / password
2. Verify: Only personal data visible
3. Check: Minimal navigation

## Debugging

### Check Auth State
```tsx
const { user, token, isLoading } = useAuth()
console.log('User:', user)
console.log('Token:', token)
console.log('Loading:', isLoading)
```

### Verify Permissions
```tsx
import { hasPermission, getRolePermissions } from '@/utils/rolePermissions'

const userPermissions = getRolePermissions('manager')
console.log('Manager permissions:', userPermissions)
console.log('Can manage reviews:', hasPermission('manager', 'manage_reviews'))
```

### Check Filtered Data
```tsx
import { filterPerformanceReviews } from '@/utils/dataFilters'

const accessible = filterPerformanceReviews(allReviews, user)
console.log('Accessible reviews:', accessible.length)
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| User not authenticated | Check localStorage for authToken and authUser |
| Role not recognized | Verify role is 'admin', 'manager', or 'employee' |
| Permission denied | Use getResourcePermissions() to debug access |
| Dashboard not showing | Check hasRole() returns true for user's role |
| Token expired | Login again; token expires after 24 hours |
| OAuth button not working | In dev mode, click button; in production, needs real OAuth |

## Production Checklist

- [ ] Replace mock auth functions with real API calls
- [ ] Implement actual JWT verification on backend
- [ ] Add database user authentication
- [ ] Configure real OAuth providers (Google, GitHub)
- [ ] Implement token refresh mechanism
- [ ] Add HTTPS enforcement
- [ ] Set up rate limiting for login
- [ ] Implement password hashing (bcrypt)
- [ ] Add audit logging
- [ ] Test all three authentication methods
- [ ] Verify role-based access in all scenarios
- [ ] Check data filtering prevents unauthorized access

## Additional Resources

- Full Documentation: `RBAC_IMPLEMENTATION.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
- Type Definitions: `src/types/index.ts`
- Auth Context: `src/contexts/AuthContext.tsx`
- Permission System: `src/utils/rolePermissions.ts`
- Data Filters: `src/utils/dataFilters.ts`
