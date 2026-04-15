function toNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function buildAiInsights(dashboardData) {
  const summary = dashboardData?.reports?.summary || {};
  const highPotentialEmployees = dashboardData?.reports?.highPotentialEmployees || [];
  const criticalSkillGaps = dashboardData?.reports?.criticalSkillGaps || [];
  const trainingCompletion = dashboardData?.reports?.trainingCompletion || [];
  const attritionRiskEmployees = dashboardData?.reports?.attritionRiskEmployees || [];

  const averageTrainingCompletion = average(
    trainingCompletion
      .filter((item) => toNumber(item.total_training_records) > 0)
      .map((item) => {
        const completed = toNumber(item.completed_training_records);
        const total = toNumber(item.total_training_records);
        return total > 0 ? (completed / total) * 100 : 0;
      })
  );

  const highGapCount = criticalSkillGaps.filter((item) => toNumber(item.gap_level) >= 2).length;
  const highAttritionCount = attritionRiskEmployees.filter((item) => {
    const value = String(item.attrition_risk || "").toLowerCase();
    return value === "high" || value === "critical";
  }).length;

  const insights = [];

  insights.push({
    id: "ai-overview",
    title: "AI Insight: Workforce Pulse",
    severity: highAttritionCount > 3 ? "high" : "medium",
    summary: `Active users: ${toNumber(summary.active_users)} | Teams: ${toNumber(summary.teams)} | Projects: ${toNumber(summary.project_outcomes)}`,
    recommendation:
      highAttritionCount > 3
        ? "Prioritize retention checkpoints for high-risk employees and involve managers in weekly follow-ups."
        : "Maintain current engagement cadence and track trend deltas weekly.",
  });

  insights.push({
    id: "ai-skills",
    title: "AI Insight: Skill Risk Forecast",
    severity: highGapCount > 5 ? "high" : "medium",
    summary: `${criticalSkillGaps.length} critical skill gaps identified, ${highGapCount} with gap level >= 2.`,
    recommendation:
      highGapCount > 5
        ? "Launch targeted upskilling sprints for the top 5 employees with the highest gap levels."
        : "Continue incremental mentoring plans and monitor monthly progression.",
  });

  insights.push({
    id: "ai-training",
    title: "AI Insight: Training Efficiency",
    severity: averageTrainingCompletion < 50 ? "high" : "low",
    summary: `Average training completion is ${averageTrainingCompletion.toFixed(1)}%. High potential employees: ${highPotentialEmployees.length}.`,
    recommendation:
      averageTrainingCompletion < 50
        ? "Reduce training path length and add manager nudges to improve completion velocity."
        : "Promote top completion patterns as reusable learning templates.",
  });

  return insights;
}
