import { UserRole } from '@/types'

export type Permission = 
  | 'manage_all_employees'
  | 'manage_team_members'
  | 'edit_employee_data'
  | 'manage_reviews'
  | 'create_reviews'
  | 'view_reviews'
  | 'manage_competencies'
  | 'manage_training'
  | 'manage_development_plans'
  | 'manage_managers'
  | 'view_organization_analytics'
  | 'view_team_analytics'
  | 'view_own_profile'
  | 'edit_own_goals'

// Editability levels based on role and relationship
export type EditLevel = 'full' | 'limited' | 'readonly' | 'none'

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'manage_all_employees',
    'edit_employee_data',
    'manage_reviews',
    'create_reviews',
    'manage_competencies',
    'manage_training',
    'manage_development_plans',
    'manage_managers',
    'view_organization_analytics',
  ],
  manager: [
    'manage_team_members',
    'edit_employee_data',
    'manage_reviews',
    'create_reviews',
    'manage_development_plans',
    'view_team_analytics',
  ],
  employee: [
    'view_own_profile',
    'view_reviews',
    'edit_own_goals',
  ],
}

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission)
}

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some((permission) => hasPermission(role, permission))
}

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every((permission) => hasPermission(role, permission))
}

export const getRolePermissions = (role: UserRole): Permission[] => {
  return rolePermissions[role]
}

export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    admin: 'HR Administrator',
    manager: 'Manager',
    employee: 'Employee',
  }
  return displayNames[role]
}

export const canManageUser = (userRole: UserRole, targetUserRole: UserRole): boolean => {
  if (userRole === 'admin') return true
  if (userRole === 'manager' && targetUserRole === 'employee') return true
  return false
}

export const getEditLevel = (userRole: UserRole, targetUserId?: string, currentUserId?: string): EditLevel => {
  // Admin can edit all data fully
  if (userRole === 'admin') return 'full'
  
  // Manager can edit their team members' data
  if (userRole === 'manager' && targetUserId && currentUserId !== targetUserId) return 'limited'
  
  // Employee can only edit their own goals
  if (userRole === 'employee') {
    if (targetUserId && currentUserId === targetUserId) return 'limited'
    return 'readonly'
  }
  
  return 'readonly'
}

export const isReadOnly = (editLevel: EditLevel): boolean => {
  return editLevel === 'readonly' || editLevel === 'none'
}

export const canEditField = (role: UserRole, fieldType: string): boolean => {
  if (role === 'admin') return true
  if (role === 'manager') return ['goals', 'competencies', 'training'].includes(fieldType)
  if (role === 'employee') return fieldType === 'goals'
  return false
}
