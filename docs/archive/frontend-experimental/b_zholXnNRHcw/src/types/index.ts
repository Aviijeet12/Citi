export type UserRole = 'admin' | 'manager' | 'employee'
export type AuthProvider = 'credentials' | 'google' | 'github'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  avatar?: string
  authProvider?: AuthProvider
  createdAt?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  jobTitle: string
  manager?: string
  hireDate: string
  status: 'active' | 'inactive' | 'on-leave'
  avatar?: string
}

export interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  period: string
  rating: number
  status: 'draft' | 'submitted' | 'approved'
  reviewer: string
  comments: string
  createdAt: string
  updatedAt: string
}

export interface DevelopmentPlan {
  id: string
  employeeId: string
  employeeName: string
  title: string
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'on-hold'
  goals: Goal[]
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed'
  progress: number
  dueDate: string
}

export interface Competency {
  id: string
  name: string
  description: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface EmployeeCompetency {
  id: string
  employeeId: string
  employeeName: string
  competency: Competency
  proficiency: number
  assessmentDate: string
}

export interface TrainingRecord {
  id: string
  employeeId: string
  employeeName: string
  courseTitle: string
  provider: string
  completionDate: string
  hours: number
  certificate?: string
  status: 'completed' | 'in-progress' | 'pending'
}

export interface DashboardMetrics {
  totalEmployees: number
  averagePerformanceRating: number
  pendingReviews: number
  completedTrainings: number
  activeGoals: number
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'warning' | 'info'
}
