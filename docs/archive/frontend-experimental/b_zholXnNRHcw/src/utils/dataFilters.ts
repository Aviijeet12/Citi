import { User, UserRole, PerformanceReview, DevelopmentPlan, TrainingRecord, Employee, EmployeeCompetency } from '@/types'

/**
 * Filter performance reviews based on user role and access level
 */
export const filterPerformanceReviews = (
  reviews: PerformanceReview[],
  user: User | null
): PerformanceReview[] => {
  if (!user) return []

  switch (user.role) {
    case 'admin':
      // Admin can see all reviews
      return reviews

    case 'manager':
      // Manager can see reviews for their team members
      // In real app, would filter by manager's team
      return reviews.filter(
        (review) =>
          review.reviewer === user.name || // Reviews they created
          review.reviewer.includes(user.name) // Or reviews they're involved with
      )

    case 'employee':
      // Employee can only see their own reviews
      return reviews.filter((review) => review.employeeId === user.id)

    default:
      return []
  }
}

/**
 * Filter development plans based on user role
 */
export const filterDevelopmentPlans = (
  plans: DevelopmentPlan[],
  user: User | null
): DevelopmentPlan[] => {
  if (!user) return []

  switch (user.role) {
    case 'admin':
      return plans

    case 'manager':
      // Manager sees plans for their team
      return plans.filter((plan) => plan.employeeName !== user.name)

    case 'employee':
      // Employee sees only their own plan
      return plans.filter((plan) => plan.employeeId === user.id)

    default:
      return []
  }
}

/**
 * Filter training records based on user role
 */
export const filterTrainingRecords = (
  records: TrainingRecord[],
  user: User | null
): TrainingRecord[] => {
  if (!user) return []

  switch (user.role) {
    case 'admin':
      return records

    case 'manager':
      // Manager can see team's training records
      return records

    case 'employee':
      // Employee sees only their own training
      return records.filter((record) => record.employeeId === user.id)

    default:
      return []
  }
}

/**
 * Filter employees based on user role
 */
export const filterEmployees = (
  employees: Employee[],
  user: User | null
): Employee[] => {
  if (!user) return []

  switch (user.role) {
    case 'admin':
      return employees

    case 'manager':
      // Manager sees only their direct reports
      // In real app, would filter by manager field
      return employees.filter((emp) => emp.manager === user.name)

    case 'employee':
      // Employee only sees themselves
      return employees.filter((emp) => emp.email === user.email)

    default:
      return []
  }
}

/**
 * Filter competencies based on user role
 */
export const filterCompetencies = (
  competencies: EmployeeCompetency[],
  user: User | null
): EmployeeCompetency[] => {
  if (!user) return []

  switch (user.role) {
    case 'admin':
      return competencies

    case 'manager':
      // Manager sees team's competencies
      return competencies

    case 'employee':
      // Employee sees only their own
      return competencies.filter((comp) => comp.employeeId === user.id)

    default:
      return []
  }
}

/**
 * Get dashboard metrics based on role
 */
export interface RoleBasedMetrics {
  totalItems: number
  pendingItems: number
  completedItems: number
  teamSize?: number
  averageRating?: number
}

export const getMetricsForRole = (
  reviews: PerformanceReview[],
  plans: DevelopmentPlan[],
  employees: Employee[],
  user: User | null
): RoleBasedMetrics => {
  if (!user) {
    return {
      totalItems: 0,
      pendingItems: 0,
      completedItems: 0,
    }
  }

  const filteredReviews = filterPerformanceReviews(reviews, user)
  const filteredPlans = filterDevelopmentPlans(plans, user)
  const filteredEmployees = filterEmployees(employees, user)

  const pendingReviews = filteredReviews.filter((r) => r.status === 'draft' || r.status === 'submitted').length
  const completedReviews = filteredReviews.filter((r) => r.status === 'approved').length
  const averageRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
    : 0

  return {
    totalItems: filteredReviews.length + filteredPlans.length,
    pendingItems: pendingReviews,
    completedItems: completedReviews,
    teamSize: filteredEmployees.length,
    averageRating: Math.round(averageRating * 100) / 100,
  }
}

/**
 * Check if user can view or edit a specific resource
 */
export const canAccessResource = (
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  resourceManagerId?: string
): boolean => {
  switch (userRole) {
    case 'admin':
      return true
    case 'manager':
      return userId === resourceManagerId || userId === resourceOwnerId
    case 'employee':
      return userId === resourceOwnerId
    default:
      return false
  }
}

/**
 * Get action permissions for a resource
 */
export interface ResourcePermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
}

export const getResourcePermissions = (
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  isOwnResource: boolean
): ResourcePermissions => {
  switch (userRole) {
    case 'admin':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
      }

    case 'manager':
      return {
        canView: !isOwnResource,
        canEdit: !isOwnResource,
        canDelete: false,
        canApprove: !isOwnResource,
      }

    case 'employee':
      return {
        canView: isOwnResource,
        canEdit: isOwnResource,
        canDelete: false,
        canApprove: false,
      }

    default:
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      }
  }
}
