export interface ValidationError {
  field: string
  message: string
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): ValidationError | null => {
  if (!password || password.length < 6) {
    return {
      field: 'password',
      message: 'Password must be at least 6 characters',
    }
  }
  return null
}

export const validateName = (name: string): ValidationError | null => {
  if (!name || name.trim().length === 0) {
    return {
      field: 'name',
      message: 'Name is required',
    }
  }
  if (name.length < 2) {
    return {
      field: 'name',
      message: 'Name must be at least 2 characters',
    }
  }
  return null
}

export const validateReviewForm = (data: {
  employeeName: string
  period: string
  rating: number
  reviewer: string
}): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.employeeName.trim()) {
    errors.push({ field: 'employeeName', message: 'Employee name is required' })
  }

  if (!data.period.trim()) {
    errors.push({ field: 'period', message: 'Period is required' })
  }

  if (data.rating < 1 || data.rating > 5) {
    errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' })
  }

  if (!data.reviewer.trim()) {
    errors.push({ field: 'reviewer', message: 'Reviewer name is required' })
  }

  return errors
}

export const validateDevelopmentPlan = (data: {
  employeeName: string
  title: string
  startDate: string
  endDate: string
}): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.employeeName.trim()) {
    errors.push({ field: 'employeeName', message: 'Employee name is required' })
  }

  if (!data.title.trim()) {
    errors.push({ field: 'title', message: 'Plan title is required' })
  }

  if (!data.startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' })
  }

  if (!data.endDate) {
    errors.push({ field: 'endDate', message: 'End date is required' })
  }

  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    errors.push({
      field: 'endDate',
      message: 'End date must be after start date',
    })
  }

  return errors
}

export const validateTrainingRecord = (data: {
  employeeName: string
  courseTitle: string
  provider: string
  hours: number
}): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.employeeName.trim()) {
    errors.push({ field: 'employeeName', message: 'Employee name is required' })
  }

  if (!data.courseTitle.trim()) {
    errors.push({ field: 'courseTitle', message: 'Course title is required' })
  }

  if (!data.provider.trim()) {
    errors.push({ field: 'provider', message: 'Provider is required' })
  }

  if (data.hours < 1) {
    errors.push({ field: 'hours', message: 'Hours must be at least 1' })
  }

  return errors
}
