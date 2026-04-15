# Performance Studio - Business Logic & Access Control

## Role-Based Access Control (RBAC)

### Overview
The system enforces strict role-based permissions at both the UI and logic levels. Three primary roles control all interactions:

- **Admin (HR Administrator)**: Full organizational access
- **Manager**: Team-level management capabilities
- **Employee**: Personal data access only

---

## Role Capabilities Matrix

### Admin Role
**Dashboard**: Organization-wide metrics and analytics
- Total employees across organization
- Average performance ratings
- Review completion status
- Training completion rates
- Organization-wide development goals

**Employee Management**
- View all employees in organization
- Edit employee data (NOT employee-editable)
- Manage all performance reviews
- Create performance reviews
- View organization analytics
- Manage all development plans
- Manage all training records
- Manage all competencies
- Access manager management features

**Key Features**
- Full CRUD operations on all employee records
- Edit manager assignments
- Set organizational policies
- Export analytics data

---

### Manager Role
**Dashboard**: Team-focused metrics
- Team size metrics
- Team performance averages
- Review completion for team
- Development goals across team
- Training completion for team

**Team Management**
- View only own team members
- Edit team member data (create goals, update reviews)
- Create performance reviews for direct reports
- View team development plans
- Manage team training records
- Cannot modify core employee data (hire date, department)
- Cannot access other teams' data

**Key Features**
- Create and manage development plans for team
- Monitor goal progress
- Recommend training courses
- Track team member performance

**Restrictions**
- Cannot create/modify performance data for non-team members
- Cannot view other managers' teams
- Cannot change employee hire date or job title
- Cannot access organizational-level settings

---

### Employee Role
**Dashboard**: Personal development tracking
- Personal performance rating
- Own performance reviews
- Active development goals
- Training history

**Personal Data Access**
- View own profile (READ-ONLY)
- View own performance reviews (READ-ONLY)
- View own development goals
- Update own goal progress (UPDATE-LIMITED)
- View own training records (READ-ONLY)
- View own competencies (READ-ONLY)

**Key Features**
- Update personal goal progress percentages
- Add notes to goal progress
- Cannot modify own employee information
- Cannot view other employees' data

**Strict Limitations**
- Cannot edit personal profile information
- Cannot create performance reviews
- Cannot change job title or department
- Cannot view salary or compensation
- Cannot view other employees' records
- Cannot download organizational data

---

## Data Editability Rules

### Core Employee Information
**Fields**: Name, Email, Job Title, Department, Hire Date, Manager, Employment Status

| Role | Edit Permission | Access Level |
|------|-----------------|--------------|
| Admin | ✅ Full Edit | Full |
| Manager | ❌ Read-Only | Self Team |
| Employee | ❌ Read-Only | Self Only |

**Protection Mechanism**
- All core fields are protected at the component level
- Read-only UI indicators display for employees/managers
- Backend validation must prevent unauthorized modifications
- Audit logging required for all admin changes

### Performance Reviews
**Fields**: Rating, Comments, Status, Reviewer

| Role | Create | Edit | Approve | Delete |
|------|--------|------|---------|--------|
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Manager | ✅ For Team | ✅ For Team | ❌ No | ❌ No |
| Employee | ❌ No | ❌ No | ❌ No | ❌ No |

### Development Goals
**Fields**: Title, Description, Progress %, Status, Due Date

| Role | Create | Edit Progress | Edit Full | Delete |
|------|--------|---|---|---|
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Manager | ✅ For Team | ✅ For Team | ✅ For Team | ✅ For Team |
| Employee | ❌ No | ✅ Own Goals | ❌ No | ❌ No |

### Training Records
**Fields**: Course Title, Provider, Hours, Completion Date, Status

| Role | Create | View | Edit | Delete |
|------|--------|------|------|--------|
| Admin | ✅ Yes | ✅ All | ✅ Yes | ✅ Yes |
| Manager | ✅ For Team | ✅ Team | ✅ For Team | ❌ No |
| Employee | ❌ No | ✅ Own | ❌ No | ❌ No |

---

## Frontend Implementation Details

### Permission Checking

```typescript
// Import utilities
import { hasPermission, getEditLevel, isReadOnly, canEditField } from '@/utils/rolePermissions'

// Example: Check if user can manage employees
const canManage = hasPermission(userRole, 'manage_all_employees')

// Example: Check editability of a specific employee
const editLevel = getEditLevel(userRole, employeeId, currentUserId)
const isReadOnlyView = isReadOnly(editLevel)

// Example: Check if specific field is editable
const canEditJobTitle = canEditField(userRole, 'jobTitle')
```

### Component-Level Enforcement

All data display components implement:

1. **Read-Only State**: When user lacks edit permission
   - Input fields disabled
   - Edit buttons hidden
   - Lock icon displayed
   - Info alert shown

2. **Edit State**: When user has permission
   - Input fields enabled
   - Edit button visible
   - Form validation active
   - Save/Cancel buttons present

3. **Permission Alerts**:
   - Information icons explain why fields are locked
   - Helpful messages direct to manager for changes
   - Color-coded status indicators

### EmployeeProfile Component Example

```typescript
const EmployeeProfile = ({ employee, userRole, currentUserId }) => {
  const editLevel = getEditLevel(userRole, employee.id, currentUserId)
  const isReadOnly = isReadOnly(editLevel)

  // Display read-only alert for non-editors
  {isReadOnly && (
    <Alert severity="info" icon={<LockIcon />}>
      This employee's information is read-only. Contact your manager for changes.
    </Alert>
  )}

  // Conditionally show edit button
  {!isReadOnly && (
    <Button onClick={onEdit}>Edit Profile</Button>
  )}
}
```

---

## Data Visibility Rules

### Organization-Wide Data
**Who can see**: Admin only
- All employee records
- All performance data
- All organizational analytics
- Compensation data
- System settings

### Team Data
**Who can see**: Manager (own team only)
- Direct report profiles
- Team performance metrics
- Team development plans
- Team training records

### Personal Data
**Who can see**: Employee (own data only) + Manager + Admin
- Own performance reviews
- Own development plans
- Own training records
- Own goals

---

## Sensitive Data Protection

### Fields Never Editable by Employees
- Employment Date
- Hire Date
- Compensation
- Job Title
- Department
- Manager Assignment
- Termination Date

### Audit Trail Requirements
All modifications must log:
- What changed
- Who made the change
- When it was changed
- Previous value
- New value
- Reason for change (if provided)

---

## Goal Update Workflow (Employee)

**Allowed Action**: Update own goal progress

1. **Employee opens goal detail**
   - Sees goal information (read-only)
   - Sees current progress percentage
   - Sees status and due date

2. **Click "Update Progress"**
   - Opens dialog form
   - Shows current progress %
   - Allows input of new percentage (0-100)
   - Allows optional notes

3. **Submit update**
   - Progress updated in system
   - Timestamp recorded
   - Manager notified (optional)
   - Goal status may auto-update if 100%

---

## Permission Denial Handling

### At UI Level
1. Buttons disabled with tooltips
2. Input fields read-only
3. Alert messages explain restrictions
4. Navigation guards prevent access to edit pages

### At Data Level (Post-Backend Integration)
1. API validation rejects unauthorized changes
2. Status codes indicate permission error (403)
3. Detailed error messages logged
4. Audit trail records attempt

### User Communication
- In-app notifications explain why action is denied
- Suggested alternative actions provided
- Clear guidance to contact manager if needed

---

## Manager Role Edge Cases

### Scenario 1: Manager A viewing employee not on team
- **Result**: Cannot see employee profile
- **UI Response**: "Not Found" or "Access Denied"

### Scenario 2: Manager A tries to edit Manager B's team member
- **Result**: Permission denied at backend
- **UI Response**: Read-only view, info alert shown

### Scenario 3: Manager promoted to Admin
- **Result**: Full access appears after re-login
- **Session Update**: Required for permission changes

---

## Testing Role-Based Access

### Admin Test Scenarios
- [ ] Can view all employees
- [ ] Can edit any employee data
- [ ] Can create performance reviews
- [ ] Can manage managers
- [ ] Can view organizational analytics

### Manager Test Scenarios
- [ ] Can view only team members
- [ ] Can edit team member goals
- [ ] Can create team reviews
- [ ] Cannot view other team data
- [ ] Cannot access admin functions

### Employee Test Scenarios
- [ ] Cannot edit profile information
- [ ] Can update own goal progress
- [ ] Can view own reviews only
- [ ] Cannot view other employee data
- [ ] Cannot create reviews

---

## Future Enhancements

1. **Department-Level Access**: Add department managers with department-specific visibility
2. **Role Hierarchy**: Add more granular roles (Senior Manager, Team Lead, etc.)
3. **Custom Permissions**: Allow admins to create custom role templates
4. **Feature Flags**: Conditional feature access based on role/department
5. **Field-Level Permissions**: Granular control per field (not just full edit/readonly)
6. **Time-Based Permissions**: Access windows for specific operations
7. **Approval Workflows**: Multi-step approval for sensitive changes

---

## Summary

The Performance Studio enforces a clear, three-tier permission model:
- **Employees** work with their own goals and read their own data
- **Managers** develop their team members within guardrails
- **Admins** maintain system integrity and organization-wide policies

No role can modify another user's core information without explicit permission, ensuring data integrity and security.
