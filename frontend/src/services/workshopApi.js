import { apiClient } from "./apiClient";

const USERS = "users-service";
const TEAMS = "teams-service";
const ACHIEVEMENTS = "achievements-service";
const METADATA = "metadata-service";
const REVIEWS = "performance-reviews-service";
const PLANS = "development-plans-service";
const COMPETENCIES = "competencies-service";
const TRAINING = "training-records-service";
const PROJECTS = "project-outcomes-service";
const REPORTS = "reports-service";

export const usersApi = {
  list: (query) => apiClient.get(USERS, "", query),
  getById: (id) => apiClient.get(USERS, id),
  create: (payload) => apiClient.post(USERS, "", payload),
  update: (id, payload) => apiClient.put(USERS, id, payload),
  remove: (id) => apiClient.delete(USERS, id),
};

export const teamsApi = {
  list: (query) => apiClient.get(TEAMS, "", query),
  getById: (id) => apiClient.get(TEAMS, id),
  create: (payload) => apiClient.post(TEAMS, "", payload),
  update: (id, payload) => apiClient.put(TEAMS, id, payload),
  remove: (id) => apiClient.delete(TEAMS, id),
  upsertMember: (teamId, payload) => apiClient.post(TEAMS, `${teamId}/members`, payload),
  updateMember: (teamId, userId, payload) => apiClient.put(TEAMS, `${teamId}/members/${userId}`, payload),
  removeMember: (teamId, userId) => apiClient.delete(TEAMS, `${teamId}/members/${userId}`),
};

export const achievementsApi = {
  list: (query) => apiClient.get(ACHIEVEMENTS, "", query),
  getById: (id) => apiClient.get(ACHIEVEMENTS, id),
  create: (payload) => apiClient.post(ACHIEVEMENTS, "", payload),
  update: (id, payload) => apiClient.put(ACHIEVEMENTS, id, payload),
  remove: (id) => apiClient.delete(ACHIEVEMENTS, id),
};

export const metadataApi = {
  listDefinitions: () => apiClient.get(METADATA, "definitions"),
  getDefinitionById: (id) => apiClient.get(METADATA, `definitions/${id}`),
  createDefinition: (payload) => apiClient.post(METADATA, "definitions", payload),
  updateDefinition: (id, payload) => apiClient.put(METADATA, `definitions/${id}`, payload),
  removeDefinition: (id) => apiClient.delete(METADATA, `definitions/${id}`),

  listValues: (query) => apiClient.get(METADATA, "values", query),
  getValueById: (id) => apiClient.get(METADATA, `values/${id}`),
  upsertValue: (payload) => apiClient.post(METADATA, "values", payload),
  updateValue: (id, payload) => apiClient.put(METADATA, `values/${id}`, payload),
  removeValue: (id) => apiClient.delete(METADATA, `values/${id}`),
};

export const performanceReviewsApi = {
  list: (query) => apiClient.get(REVIEWS, "", query),
  getById: (id) => apiClient.get(REVIEWS, id),
  create: (payload) => apiClient.post(REVIEWS, "", payload),
  update: (id, payload) => apiClient.put(REVIEWS, id, payload),
  remove: (id) => apiClient.delete(REVIEWS, id),
};

export const developmentPlansApi = {
  list: (query) => apiClient.get(PLANS, "", query),
  getById: (id) => apiClient.get(PLANS, id),
  create: (payload) => apiClient.post(PLANS, "", payload),
  update: (id, payload) => apiClient.put(PLANS, id, payload),
  remove: (id) => apiClient.delete(PLANS, id),
  createItem: (planId, payload) => apiClient.post(PLANS, `${planId}/items`, payload),
  updateItem: (planId, itemId, payload) => apiClient.put(PLANS, `${planId}/items/${itemId}`, payload),
  removeItem: (planId, itemId) => apiClient.delete(PLANS, `${planId}/items/${itemId}`),
};

export const competenciesApi = {
  list: (query) => apiClient.get(COMPETENCIES, "", query),
  getById: (id) => apiClient.get(COMPETENCIES, id),
  create: (payload) => apiClient.post(COMPETENCIES, "", payload),
  update: (id, payload) => apiClient.put(COMPETENCIES, id, payload),
  remove: (id) => apiClient.delete(COMPETENCIES, id),

  listAssessments: (query) => apiClient.get(COMPETENCIES, "assessments", query),
  upsertAssessment: (payload) => apiClient.post(COMPETENCIES, "assessments", payload),
  updateAssessment: (assessmentId, payload) => apiClient.put(COMPETENCIES, `assessments/${assessmentId}`, payload),
  removeAssessment: (assessmentId) => apiClient.delete(COMPETENCIES, `assessments/${assessmentId}`),
};

export const trainingRecordsApi = {
  list: (query) => apiClient.get(TRAINING, "", query),
  getById: (id) => apiClient.get(TRAINING, id),
  create: (payload) => apiClient.post(TRAINING, "", payload),
  update: (id, payload) => apiClient.put(TRAINING, id, payload),
  remove: (id) => apiClient.delete(TRAINING, id),
};

export const projectOutcomesApi = {
  list: (query) => apiClient.get(PROJECTS, "", query),
  getById: (id) => apiClient.get(PROJECTS, id),
  create: (payload) => apiClient.post(PROJECTS, "", payload),
  update: (id, payload) => apiClient.put(PROJECTS, id, payload),
  remove: (id) => apiClient.delete(PROJECTS, id),
  upsertContributor: (projectId, payload) => apiClient.post(PROJECTS, `${projectId}/contributors`, payload),
  removeContributor: (projectId, userId) => apiClient.delete(PROJECTS, `${projectId}/contributors/${userId}`),
};

export const reportsApi = {
  health: () => apiClient.get(REPORTS, "health"),
  ready: () => apiClient.get(REPORTS, "ready"),
  summary: () => apiClient.get(REPORTS, "summary"),
  criticalSkillGaps: () => apiClient.get(REPORTS, "critical-skill-gaps"),
  highPotentialEmployees: () => apiClient.get(REPORTS, "high-potential-employees"),
  trainingCompletion: () => apiClient.get(REPORTS, "training-completion"),
  attritionRiskEmployees: () => apiClient.get(REPORTS, "attrition-risk-employees"),
  performanceProjectCorrelation: () => apiClient.get(REPORTS, "performance-project-correlation"),
  skillsDistribution: () => apiClient.get(REPORTS, "skills-distribution"),
  leaderLocationMismatch: () => apiClient.get(REPORTS, "leader-location-mismatch"),
  leaderNonDirectStaff: () => apiClient.get(REPORTS, "leader-non-direct-staff"),
  nonDirectStaffRatios: (threshold = 0.2) => apiClient.get(REPORTS, "non-direct-staff-ratios", { threshold }),
  organizationLeaderTeams: () => apiClient.get(REPORTS, "organization-leader-teams"),
  queueSummaryJob: (filters = null) => apiClient.post(REPORTS, "jobs/summary", { filters }),
  getJob: (jobId) => apiClient.get(REPORTS, `jobs/${jobId}`),
  listJobEvents: (jobId, query = {}) => apiClient.get(REPORTS, `jobs/${jobId}/events`, query),
  processNextSummaryJob: () => apiClient.post(REPORTS, "workers/jobs/process-next", {}),
};

function extractItems(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (payload.item) {
    return [payload.item];
  }
  return [];
}

async function safeRequest(label, fallbackValue, operation, warnings) {
  try {
    return await operation();
  } catch (error) {
    warnings.push(`${label}: ${error?.message || "request failed"}`);
    return fallbackValue;
  }
}

export async function fetchDashboardData() {
  const warnings = [];

  const [
    users,
    teams,
    achievements,
    metadataDefinitions,
    metadataValues,
    performanceReviews,
    developmentPlans,
    competencies,
    competencyAssessments,
    trainingRecords,
    projectOutcomes,
    health,
    readiness,
    summary,
    highPotentialEmployees,
    criticalSkillGaps,
    trainingCompletion,
    attritionRiskEmployees,
  ] = await Promise.all([
    safeRequest("users", { items: [] }, () => usersApi.list(), warnings),
    safeRequest("teams", { items: [] }, () => teamsApi.list(), warnings),
    safeRequest("achievements", { items: [] }, () => achievementsApi.list(), warnings),
    safeRequest("metadata definitions", { items: [] }, () => metadataApi.listDefinitions(), warnings),
    safeRequest("metadata values", { items: [] }, () => metadataApi.listValues(), warnings),
    safeRequest("performance reviews", { items: [] }, () => performanceReviewsApi.list(), warnings),
    safeRequest("development plans", { items: [] }, () => developmentPlansApi.list(), warnings),
    safeRequest("competencies", { items: [] }, () => competenciesApi.list(), warnings),
    safeRequest("competency assessments", { items: [] }, () => competenciesApi.listAssessments(), warnings),
    safeRequest("training records", { items: [] }, () => trainingRecordsApi.list(), warnings),
    safeRequest("project outcomes", { items: [] }, () => projectOutcomesApi.list(), warnings),
    safeRequest("reports health", { status: "unknown" }, () => reportsApi.health(), warnings),
    safeRequest("reports readiness", { status: "unknown" }, () => reportsApi.ready(), warnings),
    safeRequest("reports summary", { item: {} }, () => reportsApi.summary(), warnings),
    safeRequest("high potential employees", { items: [] }, () => reportsApi.highPotentialEmployees(), warnings),
    safeRequest("critical skill gaps", { items: [] }, () => reportsApi.criticalSkillGaps(), warnings),
    safeRequest("training completion", { items: [] }, () => reportsApi.trainingCompletion(), warnings),
    safeRequest("attrition risk employees", { items: [] }, () => reportsApi.attritionRiskEmployees(), warnings),
  ]);

  return {
    users: extractItems(users),
    teams: extractItems(teams),
    achievements: extractItems(achievements),
    metadataDefinitions: extractItems(metadataDefinitions),
    metadataValues: extractItems(metadataValues),
    performanceReviews: extractItems(performanceReviews),
    developmentPlans: extractItems(developmentPlans),
    competencies: extractItems(competencies),
    competencyAssessments: extractItems(competencyAssessments),
    trainingRecords: extractItems(trainingRecords),
    projectOutcomes: extractItems(projectOutcomes),
    diagnostics: {
      health: health?.status || "unknown",
      readiness: readiness?.status || "unknown",
      warnings,
    },
    reports: {
      summary: summary?.item || {},
      highPotentialEmployees: extractItems(highPotentialEmployees),
      criticalSkillGaps: extractItems(criticalSkillGaps),
      trainingCompletion: extractItems(trainingCompletion),
      attritionRiskEmployees: extractItems(attritionRiskEmployees),
    },
  };
}
