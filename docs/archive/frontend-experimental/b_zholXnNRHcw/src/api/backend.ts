import { apiClient } from '@/api/client'
import {
  Competency,
  DevelopmentPlan,
  Employee,
  EmployeeCompetency,
  Goal,
  PerformanceReview,
  TrainingRecord,
  User,
  UserRole,
} from '@/types'

type BackendRoleCode = 'admin' | 'manager' | 'contributor' | 'viewer'

interface BackendListResponse<T> {
  count?: number
  items: T[]
}

interface BackendUser {
  id: string
  email: string
  display_name: string
  status: string
  created_at?: string
  updated_at?: string
  employee_code?: string | null
  first_name?: string | null
  last_name?: string | null
  department?: string | null
  job_title?: string | null
  location?: string | null
  hire_date?: string | null
  manager_user_id?: string | null
  career_level?: string | null
  is_high_potential?: boolean
  is_promotion_ready?: boolean
  attrition_risk?: string | null
  skills_summary?: string | null
  bio?: string | null
  role_codes?: BackendRoleCode[]
}

interface BackendAuthResponse {
  user: {
    id: string
    email: string
    display_name: string
    status: string
    role_codes?: BackendRoleCode[]
    permissions?: string[]
  }
  access_token: string
  refresh_token: string
  expires_in: number
}

interface BackendReview {
  id: string
  employee_user_id: string
  employee_name: string
  reviewer_user_id?: string | null
  reviewer_name?: string | null
  review_period: string
  review_date: string
  status: string
  overall_rating: number | string
  manager_feedback?: string | null
  strengths?: string | null
  improvement_areas?: string | null
  created_at: string
  updated_at: string
}

interface BackendPlanItem {
  id: string
  title: string
  description?: string | null
  status: string
  due_date?: string | null
  completion_date?: string | null
  notes?: string | null
}

interface BackendPlan {
  id: string
  employee_user_id: string
  employee_name: string
  title: string
  status: string
  start_date?: string | null
  target_date?: string | null
  created_at: string
  progress_percent?: number | string | null
  items?: BackendPlanItem[]
}

interface BackendCompetencyDefinition {
  id: string
  name: string
  description?: string | null
  category?: string | null
  is_critical?: boolean
}

interface BackendEmployeeCompetency {
  id: string
  user_id: string
  employee_name: string
  competency_id: string
  competency_name: string
  category?: string | null
  current_level: number | string
  target_level: number | string
  last_assessed_at?: string | null
  is_critical?: boolean
}

interface BackendTrainingRecord {
  id: string
  employee_user_id: string
  employee_name: string
  title: string
  provider?: string | null
  status: string
  completion_date?: string | null
  hours?: number | string | null
  certification_name?: string | null
}

interface BackendSummary {
  active_users: number
  performance_reviews: number
  development_plans: number
  training_records: number
  competencies: number
}

export interface DashboardData {
  employees: Employee[]
  reviews: PerformanceReview[]
  plans: DevelopmentPlan[]
  trainings: TrainingRecord[]
  competencies: EmployeeCompetency[]
  summary: BackendSummary
}

const DEFAULT_PASSWORD = 'ChangeMe123!'

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return ''
  }
  return String(value).split('T')[0]
}

const normalizeRole = (roleCodes?: BackendRoleCode[]): UserRole => {
  if (roleCodes?.includes('admin')) {
    return 'admin'
  }
  if (roleCodes?.includes('manager')) {
    return 'manager'
  }
  return 'employee'
}

const normalizeName = (user: Pick<BackendUser, 'display_name' | 'first_name' | 'last_name'>) => {
  const first = user.first_name?.trim()
  const last = user.last_name?.trim()
  const fullName = [first, last].filter(Boolean).join(' ').trim()
  return fullName || user.display_name
}

const normalizeEmployeeStatus = (status?: string | null): Employee['status'] => {
  const value = (status || 'active').toLowerCase()
  if (value === 'inactive') {
    return 'inactive'
  }
  if (value === 'on-leave' || value === 'on_leave') {
    return 'on-leave'
  }
  return 'active'
}

const normalizePlanStatus = (status?: string | null): DevelopmentPlan['status'] => {
  const value = (status || '').toLowerCase()
  if (value === 'completed') {
    return 'completed'
  }
  if (value === 'cancelled' || value === 'on-hold' || value === 'on_hold') {
    return 'on-hold'
  }
  return 'active'
}

const denormalizePlanStatus = (status: DevelopmentPlan['status']) => {
  if (status === 'completed') {
    return 'completed'
  }
  if (status === 'on-hold') {
    return 'cancelled'
  }
  return 'active'
}

const normalizeGoalStatus = (status?: string | null): Goal['status'] => {
  const value = (status || '').toLowerCase()
  if (value === 'completed') {
    return 'completed'
  }
  if (value === 'in-progress' || value === 'in_progress') {
    return 'in-progress'
  }
  return 'not-started'
}

const denormalizeGoalStatus = (status: Goal['status']) => {
  if (status === 'completed') {
    return 'completed'
  }
  if (status === 'in-progress') {
    return 'in_progress'
  }
  return 'planned'
}

const normalizeTrainingStatus = (status?: string | null): TrainingRecord['status'] => {
  const value = (status || '').toLowerCase()
  if (value === 'completed') {
    return 'completed'
  }
  if (value === 'active' || value === 'in-progress' || value === 'in_progress') {
    return 'in-progress'
  }
  return 'pending'
}

const denormalizeTrainingStatus = (status: TrainingRecord['status']) => {
  if (status === 'completed') {
    return 'completed'
  }
  if (status === 'in-progress') {
    return 'in_progress'
  }
  return 'planned'
}

const mapCompetencyLevel = (targetLevel?: number) => {
  if (!targetLevel || targetLevel <= 2) {
    return 'beginner' as const
  }
  if (targetLevel <= 3) {
    return 'intermediate' as const
  }
  if (targetLevel <= 4) {
    return 'advanced' as const
  }
  return 'expert' as const
}

const buildManagerMap = (users: BackendUser[]) => {
  return new Map(users.map((user) => [user.id, normalizeName(user)]))
}

const mapUserToAuthUser = (user: BackendUser | BackendAuthResponse['user']): User => {
  return {
    id: user.id,
    name: user.display_name,
    email: user.email,
    role: normalizeRole(user.role_codes),
    department: 'department' in user && user.department ? user.department : 'General',
    authProvider: 'credentials',
    createdAt: 'created_at' in user ? user.created_at : new Date().toISOString(),
  }
}

const mapUserToEmployee = (user: BackendUser, managerNames: Map<string, string>): Employee => {
  return {
    id: user.id,
    name: normalizeName(user),
    email: user.email,
    department: user.department || 'General',
    jobTitle: user.job_title || 'Employee',
    manager: user.manager_user_id ? managerNames.get(user.manager_user_id) || 'Unassigned' : 'Unassigned',
    hireDate: normalizeDate(user.hire_date) || normalizeDate(user.created_at) || new Date().toISOString().split('T')[0],
    status: normalizeEmployeeStatus(user.status),
  }
}

const mapReview = (review: BackendReview): PerformanceReview => {
  return {
    id: review.id,
    employeeId: review.employee_user_id,
    employeeName: review.employee_name,
    period: review.review_period,
    rating: Number(review.overall_rating),
    status: (review.status?.toLowerCase() || 'draft') as PerformanceReview['status'],
    reviewer: review.reviewer_name || 'Unassigned',
    comments:
      review.manager_feedback ||
      review.strengths ||
      review.improvement_areas ||
      '',
    createdAt: normalizeDate(review.created_at),
    updatedAt: normalizeDate(review.updated_at),
  }
}

const mapGoal = (item: BackendPlanItem): Goal => {
  const progress = item.status === 'completed' ? 100 : item.status === 'in_progress' || item.status === 'in-progress' ? 50 : 0
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    status: normalizeGoalStatus(item.status),
    progress,
    dueDate: normalizeDate(item.due_date),
  }
}

const mapPlan = (plan: BackendPlan): DevelopmentPlan => {
  return {
    id: plan.id,
    employeeId: plan.employee_user_id,
    employeeName: plan.employee_name,
    title: plan.title,
    startDate: normalizeDate(plan.start_date),
    endDate: normalizeDate(plan.target_date),
    status: normalizePlanStatus(plan.status),
    goals: (plan.items || []).map(mapGoal),
    createdAt: normalizeDate(plan.created_at),
  }
}

const mapCompetencyDefinition = (
  definition: BackendCompetencyDefinition,
  assessment?: BackendEmployeeCompetency
): Competency => {
  const level = mapCompetencyLevel(assessment ? Number(assessment.target_level) : undefined)
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description || '',
    category: definition.category || 'General',
    level,
  }
}

const mapEmployeeCompetency = (
  assessment: BackendEmployeeCompetency,
  definitionsById: Map<string, BackendCompetencyDefinition>
): EmployeeCompetency => {
  const definition = definitionsById.get(assessment.competency_id)
  return {
    id: assessment.id,
    employeeId: assessment.user_id,
    employeeName: assessment.employee_name,
    competency: mapCompetencyDefinition(
      definition || {
        id: assessment.competency_id,
        name: assessment.competency_name,
        category: assessment.category || 'General',
      },
      assessment
    ),
    proficiency: Number(assessment.current_level),
    assessmentDate: normalizeDate(assessment.last_assessed_at),
  }
}

const mapTrainingRecord = (record: BackendTrainingRecord): TrainingRecord => {
  return {
    id: record.id,
    employeeId: record.employee_user_id,
    employeeName: record.employee_name,
    courseTitle: record.title,
    provider: record.provider || 'Internal',
    completionDate: normalizeDate(record.completion_date),
    hours: Number(record.hours || 0),
    certificate: record.certification_name || undefined,
    status: normalizeTrainingStatus(record.status),
  }
}

const exactMatch = (value: string, query: string) => value.trim().toLowerCase() === query.trim().toLowerCase()

const getStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('authUser')
  if (!savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser) as User
  } catch {
    return null
  }
}

export const listUsers = async () => {
  const response = await apiClient.getRaw<BackendListResponse<BackendUser>>('/users-service')
  return response.items
}

export const listEmployees = async (): Promise<Employee[]> => {
  const users = await listUsers()
  const managerNames = buildManagerMap(users)
  return users.map((user) => mapUserToEmployee(user, managerNames))
}

export const findEmployeeByName = async (name: string) => {
  const response = await apiClient.getRaw<BackendListResponse<BackendUser>>(
    `/users-service?q=${encodeURIComponent(name)}`
  )
  const matchedUser =
    response.items.find((user) => exactMatch(normalizeName(user), name)) ||
    response.items.find((user) => exactMatch(user.display_name, name)) ||
    response.items[0]

  return matchedUser || null
}

export const listReviews = async (): Promise<PerformanceReview[]> => {
  const response = await apiClient.getRaw<BackendListResponse<BackendReview>>('/performance-reviews-service')
  return response.items.map(mapReview)
}

export const saveReview = async (review: PerformanceReview) => {
  const employee = await findEmployeeByName(review.employeeName)
  if (!employee) {
    throw new Error(`Employee "${review.employeeName}" was not found`)
  }

  let reviewerUserId: string | undefined
  if (review.reviewer) {
    const reviewer = await findEmployeeByName(review.reviewer)
    reviewerUserId = reviewer?.id
  }

  const payload = {
    employee_user_id: employee.id,
    reviewer_user_id: reviewerUserId,
    review_period: review.period,
    review_date: review.updatedAt || review.createdAt || new Date().toISOString().split('T')[0],
    status: review.status,
    overall_rating: review.rating,
    manager_feedback: review.comments,
  }

  const response = review.id
    ? await apiClient.putRaw<{ item: BackendReview }>(`/performance-reviews-service/${review.id}`, payload)
    : await apiClient.postRaw<{ item: BackendReview }>('/performance-reviews-service', payload)

  return mapReview(response.item)
}

export const deleteReview = async (id: string) => {
  await apiClient.deleteRaw(`/performance-reviews-service/${id}`)
}

export const listDevelopmentPlans = async (): Promise<DevelopmentPlan[]> => {
  const response = await apiClient.getRaw<BackendListResponse<BackendPlan>>('/development-plans-service')
  const plans = await Promise.all(
    response.items.map(async (plan) => {
      const detail = await apiClient.getRaw<{ item: BackendPlan }>(`/development-plans-service/${plan.id}`)
      return mapPlan(detail.item)
    })
  )
  return plans
}

export const saveDevelopmentPlan = async (plan: DevelopmentPlan) => {
  const employee = await findEmployeeByName(plan.employeeName)
  if (!employee) {
    throw new Error(`Employee "${plan.employeeName}" was not found`)
  }

  const payload = {
    employee_user_id: employee.id,
    title: plan.title,
    status: denormalizePlanStatus(plan.status),
    start_date: plan.startDate || null,
    target_date: plan.endDate || null,
    items: plan.goals.map((goal) => ({
      title: goal.title,
      description: goal.description,
      status: denormalizeGoalStatus(goal.status),
      due_date: goal.dueDate || null,
      completion_date: goal.status === 'completed' ? goal.dueDate || new Date().toISOString().split('T')[0] : null,
      notes: `Progress ${goal.progress}%`,
    })),
  }

  const response = plan.id
    ? await apiClient.putRaw<{ item: BackendPlan }>(`/development-plans-service/${plan.id}`, payload)
    : await apiClient.postRaw<{ item: BackendPlan }>('/development-plans-service', payload)

  return mapPlan(response.item)
}

export const deleteDevelopmentPlan = async (id: string) => {
  await apiClient.deleteRaw(`/development-plans-service/${id}`)
}

export const listCompetencyDefinitions = async (): Promise<Competency[]> => {
  const response = await apiClient.getRaw<BackendListResponse<BackendCompetencyDefinition>>('/competencies-service')
  return response.items.map((item) => mapCompetencyDefinition(item))
}

export const listEmployeeCompetencies = async (): Promise<EmployeeCompetency[]> => {
  const [definitionsResponse, assessmentsResponse] = await Promise.all([
    apiClient.getRaw<BackendListResponse<BackendCompetencyDefinition>>('/competencies-service'),
    apiClient.getRaw<BackendListResponse<BackendEmployeeCompetency>>('/competencies-service/assessments'),
  ])

  const definitionsById = new Map(definitionsResponse.items.map((item) => [item.id, item]))
  return assessmentsResponse.items.map((item) => mapEmployeeCompetency(item, definitionsById))
}

export const saveEmployeeCompetency = async (competency: EmployeeCompetency) => {
  const employee = await findEmployeeByName(competency.employeeName)
  if (!employee) {
    throw new Error(`Employee "${competency.employeeName}" was not found`)
  }

  const payload = {
    user_id: employee.id,
    competency_id: competency.competency.id,
    current_level: competency.proficiency,
    target_level: Math.max(competency.proficiency, competency.competency.level === 'expert' ? 5 : competency.proficiency),
    last_assessed_at: competency.assessmentDate || new Date().toISOString().split('T')[0],
  }

  if (competency.id) {
    await apiClient.putRaw(`/competencies-service/assessments/${competency.id}`, payload)
  } else {
    await apiClient.postRaw('/competencies-service/assessments', payload)
  }
}

export const deleteEmployeeCompetency = async (id: string) => {
  await apiClient.deleteRaw(`/competencies-service/assessments/${id}`)
}

export const listTrainingRecords = async (): Promise<TrainingRecord[]> => {
  const response = await apiClient.getRaw<BackendListResponse<BackendTrainingRecord>>('/training-records-service')
  return response.items.map(mapTrainingRecord)
}

export const saveTrainingRecord = async (record: TrainingRecord) => {
  const employee = await findEmployeeByName(record.employeeName)
  if (!employee) {
    throw new Error(`Employee "${record.employeeName}" was not found`)
  }

  const payload = {
    employee_user_id: employee.id,
    title: record.courseTitle,
    provider: record.provider,
    status: denormalizeTrainingStatus(record.status),
    completion_date: record.completionDate || null,
    hours: record.hours,
    certification_name: record.certificate || null,
  }

  const response = record.id
    ? await apiClient.putRaw<{ item: BackendTrainingRecord }>(`/training-records-service/${record.id}`, payload)
    : await apiClient.postRaw<{ item: BackendTrainingRecord }>('/training-records-service', payload)

  return mapTrainingRecord(response.item)
}

export const deleteTrainingRecord = async (id: string) => {
  await apiClient.deleteRaw(`/training-records-service/${id}`)
}

export const searchAllData = async () => {
  const [employees, reviews, plans, trainings, competencies] = await Promise.all([
    listEmployees(),
    listReviews(),
    listDevelopmentPlans(),
    listTrainingRecords(),
    listEmployeeCompetencies(),
  ])

  return { employees, reviews, plans, trainings, competencies }
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const [summaryResponse, employees, reviews, plans, trainings, competencies] = await Promise.all([
    apiClient.getRaw<{ item: BackendSummary }>('/reports-service/summary'),
    listEmployees(),
    listReviews(),
    listDevelopmentPlans(),
    listTrainingRecords(),
    listEmployeeCompetencies(),
  ])

  return {
    employees,
    reviews,
    plans,
    trainings,
    competencies,
    summary: summaryResponse.item,
  }
}

export const loginWithCredentials = async (email: string, password: string) => {
  const response = await apiClient.postRaw<BackendAuthResponse>('/auth-service/login', {
    email,
    password,
  })

  const user = mapUserToAuthUser(response.user)
  localStorage.setItem('refreshToken', response.refresh_token)

  return {
    user,
    token: response.access_token,
  }
}

export const logoutFromBackend = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return
  }

  try {
    await apiClient.postRaw('/auth-service/logout', { refresh_token: refreshToken })
  } finally {
    localStorage.removeItem('refreshToken')
  }
}

export const loadCurrentUser = async () => {
  const response = await apiClient.getRaw<{ user: BackendAuthResponse['user'] }>('/auth-service/me')
  return mapUserToAuthUser(response.user)
}

export const createSeedUser = async (role: UserRole) => {
  const currentUser = getStoredUser()
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Only admins can create demo users')
  }

  const profiles: Record<UserRole, Omit<BackendUser, 'id' | 'status' | 'role_codes' | 'display_name' | 'email'> & { email: string; display_name: string; role_codes: BackendRoleCode[] }> = {
    admin: {
      email: 'admin@acme.local',
      display_name: 'ACME Admin',
      first_name: 'ACME',
      last_name: 'Admin',
      department: 'HR',
      job_title: 'HR Administrator',
      hire_date: '2024-01-01',
      role_codes: ['admin'],
    },
    manager: {
      email: 'manager@acme.local',
      display_name: 'Team Manager',
      first_name: 'Team',
      last_name: 'Manager',
      department: 'Engineering',
      job_title: 'Engineering Manager',
      hire_date: '2024-01-01',
      role_codes: ['manager'],
    },
    employee: {
      email: 'employee@acme.local',
      display_name: 'Team Member',
      first_name: 'Team',
      last_name: 'Member',
      department: 'Engineering',
      job_title: 'Software Engineer',
      hire_date: '2024-01-01',
      role_codes: ['viewer'],
    },
  }

  const profile = profiles[role]
  try {
    const response = await apiClient.postRaw<{ item: BackendUser }>('/users-service', {
      ...profile,
      password: DEFAULT_PASSWORD,
    })
    return mapUserToAuthUser(response.item)
  } catch (error: any) {
    if (error?.status === 400) {
      const existing = await findEmployeeByName(profile.display_name)
      if (existing) {
        return mapUserToAuthUser(existing)
      }
    }
    throw error
  }
}

