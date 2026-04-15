# RBAC Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Application                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐        ┌──────────────────┐   ┌─────────────┐ │
│  │  Login Page │───────▶│  Auth Context    │◀──│  Layout     │ │
│  │ (OAuth +    │        │ (State Mgmt)     │   │ (Navigation)│ │
│  │ Credentials)│        │                  │   └─────────────┘ │
│  └─────────────┘        └──────────────────┘                    │
│         │                      ▲                                 │
│         │                      │                                 │
│         └──────────────────────┼─────────────────────────────┐   │
│                                │                             │   │
│                    ┌───────────┴──────────┐                  │   │
│                    │  Protected Routes    │                  │   │
│                    │ (Role/Permission)    │                  │   │
│                    └───────────┬──────────┘                  │   │
│                                │                             │   │
│         ┌──────────────────────┼─────────────────────┐       │   │
│         │                      │                     │       │   │
│    ┌────▼────┐        ┌────────▼──────┐      ┌──────▼────┐  │   │
│    │ Admin   │        │ Manager       │      │ Employee │  │   │
│    │Dashboard│        │ Dashboard     │      │Dashboard │  │   │
│    └────▲────┘        └────────▲──────┘      └──────▲────┘  │   │
│         │                      │                     │       │   │
│         └──────────┬───────────┴─────────────┬───────┘       │   │
│                    │                         │               │   │
│             ┌──────▼──────────────────┐      │               │   │
│             │   Data Filtering Layer  │      │               │   │
│             │ (Role-Based Access)     │      │               │   │
│             └──────┬──────────────────┘      │               │   │
│                    │                         │               │   │
│                    │    ┌────────────────────┴──────────┐    │   │
│                    │    │                               │    │   │
│             ┌──────▼────▼────────────────────────┐     │    │   │
│             │    Permission System               │     │    │   │
│             │ - rolePermissions.ts               │     │    │   │
│             │ - dataFilters.ts                   │     │    │   │
│             └──────▲─────────────────────────────┘     │    │   │
│                    │                                   │    │   │
│                    │    ┌──────────────────────────────┘    │   │
│                    │    │                                   │   │
│             ┌──────▼────▼────────────────────────┐         │   │
│             │    Authentication System           │         │   │
│             │ - JWT (Credentials)                │         │   │
│             │ - Google OAuth (Mock)              │         │   │
│             │ - GitHub OAuth (Mock)              │         │   │
│             └────────────────────────────────────┘         │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Login Flow
```
User Input (Email/Password)
        │
        ▼
┌─────────────────────┐
│ Login Component     │
│ (Login.tsx)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ useAuth() Hook              │
│ - login()                   │
│ - loginWithGoogle()         │
│ - loginWithGitHub()         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Auth Utils                  │
│ (authUtils.ts)              │
│ - authenticateWithXXX()     │
│ - generateMockToken()       │
│ - validateToken()           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Auth Context                │
│ - Store user & token        │
│ - localStorage.setItem()    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Protected Route             │
│ - Check user exists         │
│ - Verify role/permission    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Role-Specific Dashboard     │
│ - Load role-specific data   │
│ - Apply data filters        │
└─────────────────────────────┘
```

### Data Access Flow
```
Component Request
        │
        ▼
┌─────────────────────┐
│ useAuth()           │
│ Get current user    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ Data Filtering Functions    │
│ - filterPerformanceReviews()│
│ - filterDevelopmentPlans()  │
│ - filterEmployees()         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Filter by Role              │
│ - Admin: All data           │
│ - Manager: Team data        │
│ - Employee: Personal data   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Filtered Results            │
│ Return to component         │
└─────────────────────────────┘
```

### Permission Check Flow
```
Component Needs Access
        │
        ▼
┌─────────────────────────────┐
│ hasPermission()             │
│ getRolePermissions()        │
│ getResourcePermissions()    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Role Permission Matrix      │
│ (rolePermissions.ts)        │
│ - admin permissions         │
│ - manager permissions       │
│ - employee permissions      │
└──────────┬──────────────────┘
           │
           ├─▶ Permission Granted
           │   Show Component/Button
           │
           └─▶ Permission Denied
               Hide/Disable
```

## Component Hierarchy

```
App
├── Login (Public Route)
│   ├── Credentials Form
│   ├── Google OAuth Button
│   └── GitHub OAuth Button
│
├── ProtectedRoute
│   └── Layout
│       ├── AppBar
│       │   ├── Logo
│       │   ├── Search
│       │   └── User Menu
│       │
│       ├── Sidebar
│       │   ├── Logo
│       │   ├── Navigation Items (Filtered by Role)
│       │   └── User Info + Role Badge
│       │
│       └── Main Content
│           └── Outlet
│               ├── /dashboard
│               │   ├── AdminDashboard
│               │   ├── ManagerDashboard
│               │   └── EmployeeDashboard
│               │
│               ├── /reviews
│               │   └── Reviews Page
│               │
│               ├── /development-plans
│               │   └── Development Plans Page
│               │
│               ├── /competencies
│               │   └── Competencies Page
│               │
│               └── /training
│                   └── Training Records Page
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Auth Context                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  State:                                                 │
│  ├─ user: User | null                                   │
│  ├─ token: string | null                                │
│  ├─ isLoading: boolean                                  │
│  └─ error: string | null                                │
│                                                         │
│  Methods:                                               │
│  ├─ login(email, password): Promise<void>               │
│  ├─ loginWithGoogle(token): Promise<void>               │
│  ├─ loginWithGitHub(token): Promise<void>               │
│  ├─ logout(): void                                      │
│  └─ hasRole(role): boolean                              │
│                                                         │
│  Persistence:                                           │
│  └─ localStorage → authToken, authUser                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ Consumed by
         │
         ├─▶ Protected Routes (Role checking)
         ├─▶ Layout (User display, Role badge)
         ├─▶ Dashboards (Data filtering)
         └─▶ Components (Permission checks)
```

## Authentication Methods

### 1. Credentials (JWT)
```
User Input
    │
    ▼
authenticateWithCredentials()
    │
    ├─▶ Find user in mock DB
    ├─▶ Verify password
    │
    ▼
Generate JWT Token
    │
    ├─▶ Header: {alg: 'HS256', typ: 'JWT'}
    ├─▶ Payload: {sub: userId, provider: 'credentials', iat, exp}
    └─▶ Signature: mock-signature-{timestamp}
    │
    ▼
Return {user, token}
```

### 2. Google OAuth
```
User clicks "Login with Google"
    │
    ▼
authenticateWithGoogle(googleToken)
    │
    ├─▶ Verify with Google (mock)
    ├─▶ Extract user info
    │
    ▼
Generate JWT Token
    │
    └─▶ payload.provider: 'google'
    │
    ▼
Return {user, token}
```

### 3. GitHub OAuth
```
User clicks "Login with GitHub"
    │
    ▼
authenticateWithGitHub(githubToken)
    │
    ├─▶ Verify with GitHub (mock)
    ├─▶ Extract user info
    │
    ▼
Generate JWT Token
    │
    └─▶ payload.provider: 'github'
    │
    ▼
Return {user, token}
```

## Permission Hierarchy

```
Admin (Highest Privilege)
├─ manage_all_employees
├─ manage_reviews ◀─┐
├─ manage_competencies
├─ manage_training
├─ manage_development_plans ◀─┐
└─ view_organization_analytics

Manager
├─ manage_team_members
├─ manage_reviews ◀─┐
├─ manage_development_plans ◀─┐
└─ view_team_analytics

Employee (Lowest Privilege)
├─ view_own_profile
├─ view_reviews (own only)
└─ edit_own_goals
```

## Data Access Matrix

|                    | Admin | Manager | Employee |
|:------------------:|:-----:|:-------:|:--------:|
| View all employees | ✓     | ✗       | ✗        |
| View team members  | ✓     | ✓       | ✗        |
| View own profile   | ✓     | ✓       | ✓        |
| All reviews        | ✓     | ✗       | ✗        |
| Team reviews       | ✓     | ✓       | ✗        |
| Own reviews        | ✓     | ✓       | ✓        |
| All competencies   | ✓     | ✗       | ✗        |
| Team competencies  | ✓     | ✓       | ✗        |
| Own competencies   | ✓     | ✓       | ✓        |
| Create reviews     | ✓     | ✓       | ✗        |
| Approve reviews    | ✓     | ✗       | ✗        |

## File Dependencies

```
AuthContext.tsx
├─ authUtils.ts (authentication logic)
├─ types.ts (User, UserRole, AuthProvider)
└─ localStorage (session persistence)

Dashboard.tsx
├─ AuthContext.tsx (get user role)
├─ AdminDashboard.tsx
├─ ManagerDashboard.tsx
├─ EmployeeDashboard.tsx
├─ dataFilters.ts (filter data)
└─ mockData.ts (data source)

Layout.tsx
├─ AuthContext.tsx (user info)
├─ rolePermissions.ts (display names)
├─ ProtectedRoute.tsx (route guarding)
└─ MUI Components

ProtectedRoute.tsx
├─ AuthContext.tsx (user check)
├─ types.ts (UserRole)
└─ rolePermissions.ts (permission check)
```

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│         Production Deployment            │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────┐                     │
│  │  React App     │                     │
│  │ (This Frontend)│                     │
│  └────────┬───────┘                     │
│           │                             │
│           ▼                             │
│  ┌────────────────────────────┐         │
│  │   API Gateway / Backend    │         │
│  │  - Auth Endpoints          │         │
│  │  - Data Endpoints          │         │
│  │  - Permission Checks       │         │
│  └────────┬───────────────────┘         │
│           │                             │
│           ▼                             │
│  ┌────────────────────────────┐         │
│  │   Database                 │         │
│  │  - Users                   │         │
│  │  - Reviews                 │         │
│  │  - Plans                   │         │
│  │  - Training                │         │
│  └────────────────────────────┘         │
│                                          │
│  ┌────────────────────────────┐         │
│  │  External OAuth Providers  │         │
│  │  - Google OAuth            │         │
│  │  - GitHub OAuth            │         │
│  └────────────────────────────┘         │
│                                          │
└──────────────────────────────────────────┘
```

## Summary

This RBAC system provides:
- **Multi-method authentication** (Credentials + OAuth)
- **Three-tier role hierarchy** (Admin → Manager → Employee)
- **Granular permissions** (11 distinct permissions)
- **Automatic data filtering** (Server-side in production)
- **Role-specific dashboards** (Different views per role)
- **Protected routes** (Role + permission verification)
- **UI customization** (Navigation, badges, empty states)

All components work together to ensure users can only access data and perform actions appropriate for their role.
