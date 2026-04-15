# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This document outlines the complete implementation of Role-Based Access Control (RBAC) with multiple authentication methods and role-specific dashboards for the Employee Performance Management Platform.

## Architecture

### 1. Authentication System

#### Supported Methods
- **Credentials** (Username/Password) - JWT token-based
- **Google OAuth** - Via Google's OAuth 2.0
- **GitHub OAuth** - Via GitHub's OAuth 2.0

#### Files
- `src/utils/authUtils.ts` - Authentication logic and token management
- `src/contexts/AuthContext.tsx` - React Context for auth state management
- `src/pages/Login.tsx` - Enhanced login page with all auth methods

#### Key Features
- Token validation with expiry checking
- Mock user database with role assignments
- Session persistence via localStorage
- Error handling and user feedback

### 2. Authorization & Role Permissions

#### Roles Defined
1. **HR Administrator (Admin)**
   - Full organizational access
   - Can manage all employees, reviews, competencies, training
   - View organization-wide analytics

2. **Manager**
   - Team-level access only
   - Can manage reviews and development plans for team members
   - View team analytics
   - Cannot modify global/organizational data

3. **Employee**
   - Self-only access (read-heavy)
   - View own reviews, skills, training, development plans
   - Can update personal goals

#### Permissions File
- `src/utils/rolePermissions.ts` - Permission matrix and utility functions
  - `hasPermission()` - Check single permission
  - `hasAnyPermission()` - Check multiple permissions (OR)
  - `hasAllPermissions()` - Check multiple permissions (AND)
  - `getRoleDisplayName()` - User-friendly role names
  - `canManageUser()` - Check if one user can manage another

### 3. Data Filtering

#### File Location
- `src/utils/dataFilters.ts` - Role-based data filtering utilities

#### Filtering Functions
- `filterPerformanceReviews()` - Filter reviews based on role
- `filterDevelopmentPlans()` - Filter plans based on role
- `filterTrainingRecords()` - Filter training based on role
- `filterEmployees()` - Filter employee list based on role
- `filterCompetencies()` - Filter competencies based on role
- `getMetricsForRole()` - Calculate role-specific dashboard metrics
- `getResourcePermissions()` - Fine-grained permission checks

### 4. Dashboard Components

#### Admin Dashboard
- **File**: `src/components/dashboards/AdminDashboard.tsx`
- **Metrics**: Total employees, org-wide avg rating, pending reviews, completed reviews
- **Features**: All reviews visible, development plans overview, full data access
- **Use Case**: Strategic overview and organizational management

#### Manager Dashboard
- **File**: `src/components/dashboards/ManagerDashboard.tsx`
- **Metrics**: Team size, team avg rating, pending reviews, active development plans
- **Features**: Team-specific reviews, team development tracking, action items
- **Use Case**: Team management and performance oversight

#### Employee Dashboard
- **File**: `src/components/dashboards/EmployeeDashboard.tsx`
- **Metrics**: Latest rating, active goals, training hours, competencies count
- **Features**: Personal review history, development plan progress, training records
- **Use Case**: Self-service performance tracking and development

### 5. Route Protection

#### Enhanced ProtectedRoute Component
- **File**: `src/components/ProtectedRoute.tsx`
- **Features**:
  - Role-based access control (`requiredRole` prop)
  - Permission-based access control (`requiredPermission` prop)
  - Token validation
  - Automatic redirect to unauthorized page

#### Usage
```tsx
// Role-based protection
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// Permission-based protection
<ProtectedRoute requiredPermission="manage_reviews">
  <ReviewManagement />
</ProtectedRoute>

// Multiple roles (OR)
<ProtectedRoute requiredRole={['admin', 'manager']}>
  <ReviewsPage />
</ProtectedRoute>
```

### 6. UI Enhancements

#### Layout Component
- **File**: `src/components/Layout.tsx`
- **Enhancements**:
  - Role badge in sidebar showing user's role with color coding
  - Dynamic navigation filtering (nav items shown/hidden based on role)
  - Color-coded role badges:
    - Admin: Blue (#102A43)
    - Manager: Teal (#06A8A8)
    - Employee: Amber (#F4B860)

#### Login Page
- **File**: `src/pages/Login.tsx`
- **Features**:
  - Three authentication method buttons (Credentials, Google, GitHub)
  - Demo account quick-select cards
  - Error messages and loading states
  - Mock OAuth implementations

### 7. Type System

#### Enhanced User Types
- **File**: `src/types/index.ts`
- **New Fields**:
  - `authProvider`: 'credentials' | 'google' | 'github'
  - `createdAt`: Timestamp when user was created/authenticated
- **New Types**:
  - `AuthProvider`: Enum for authentication methods

## Demo Accounts

### Admin
- **Email**: admin@company.com
- **Password**: password
- **Role**: HR Administrator
- **Department**: Executive

### Manager
- **Email**: manager@company.com
- **Password**: password
- **Role**: Manager
- **Department**: Engineering

### Employee
- **Email**: employee@company.com
- **Password**: password
- **Role**: Employee
- **Department**: Product

## Security Considerations

### Current Implementation (Development)
- JWT tokens with expiry validation
- Token stored in localStorage (with expiry check)
- Mock authentication for demo purposes
- Mock user database

### Production Requirements
- Implement actual OAuth 2.0 with provider SDKs
- Store tokens in httpOnly cookies (not localStorage)
- Validate tokens on backend
- Use actual database with hashed passwords
- Implement proper session management
- Add rate limiting on login attempts
- Use HTTPS for all communications
- Implement CSRF protection

## Integration Guide

### Using AuthContext
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, token, login, logout, hasRole } = useAuth()

  if (hasRole('admin')) {
    // Show admin-only content
  }
}
```

### Using Permissions
```tsx
import { hasPermission } from '@/utils/rolePermissions'

if (hasPermission(user.role, 'manage_reviews')) {
  // Show review management UI
}
```

### Using Data Filters
```tsx
import { filterPerformanceReviews } from '@/utils/dataFilters'

const accessibleReviews = filterPerformanceReviews(allReviews, user)
```

## File Structure
```
src/
├── contexts/
│   └── AuthContext.tsx          (Auth state management)
├── pages/
│   ├── Login.tsx                (Enhanced login with 3 methods)
│   └── Dashboard.tsx            (Role-based dashboard router)
├── components/
│   ├── Layout.tsx               (Updated with role indicators)
│   ├── ProtectedRoute.tsx       (Enhanced route protection)
│   └── dashboards/
│       ├── AdminDashboard.tsx
│       ├── ManagerDashboard.tsx
│       └── EmployeeDashboard.tsx
├── utils/
│   ├── authUtils.ts            (Auth logic & token management)
│   ├── rolePermissions.ts      (Permission matrix)
│   └── dataFilters.ts          (Role-based data filtering)
└── types/
    └── index.ts                (Updated with auth types)
```

## Next Steps for Production

1. **OAuth Integration**
   - Add @react-oauth/google for Google OAuth
   - Add @octokit/auth-oauth-device for GitHub OAuth
   - Configure provider credentials

2. **Backend Integration**
   - Replace mock authUtils with API calls
   - Implement actual JWT verification
   - Add database authentication queries

3. **State Management**
   - Consider upgrading to Redux/Zustand for complex scenarios
   - Implement token refresh logic

4. **Security Audit**
   - Review CORS settings
   - Implement content security policies
   - Add request signing and validation

5. **Testing**
   - Unit tests for permission functions
   - Integration tests for protected routes
   - E2E tests for login flows

## Troubleshooting

### User Can't See Dashboard
1. Check if user is authenticated (`useAuth().user` is not null)
2. Verify role is correctly set (admin/manager/employee)
3. Check localStorage for authToken and authUser

### Permissions Not Working
1. Verify role in User object matches UserRole type
2. Check permission string matches Permission type
3. Use hasPermission() utility for testing

### OAuth Not Working (Development)
1. In development, OAuth uses mock tokens
2. Click on OAuth buttons to simulate login
3. For production, integrate actual OAuth providers

## Support

For questions or issues with the RBAC implementation, refer to this guide or the individual utility files for detailed documentation.
