export type Role = "admin" | "analyst" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  profileCompleted?: boolean;
};

export type SettingsProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  notificationsEnabled: boolean;
  companyName: string;
  phone: string;
  socials: string;
  createdAt: string;
  hasPersonalGeminiKey: boolean;
  geminiKeyLast4: string | null;
  geminiKeyUpdatedAt: string | null;
};

export type SettingsResponse = {
  profile: SettingsProfile;
  message?: string;
};

export type DashboardMetricKey =
  | "totalAnalyses"
  | "avgRiskScore"
  | "complianceAlerts"
  | "costLeakageOpportunities"
  | "vendorRiskCount"
  | "decisionsPendingReview";

export type DashboardData = {
  metrics: Record<DashboardMetricKey, number>;
  riskTrend: { month: string; risk: number; trust: number }[];
  departmentRisk: { department: string; risk: number }[];
  costLeakage: { name: string; value: number }[];
  recentDecisions: DecisionRow[];
  highPriorityAlerts: AlertRow[];
};

export type DecisionRow = {
  _id: string;
  title: string;
  department: string;
  industry: string;
  urgency: "low" | "medium" | "high" | "critical";
  createdAt: string;
  analysis?: AnalysisResult;
};

export type AlertRow = {
  _id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  resolved: boolean;
  createdAt: string;
};

export type AuditLogRow = {
  _id: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId?: {
    name?: string;
    email?: string;
    role?: Role;
  };
};

export type AdminUserRow = User & {
  _id?: string;
  createdAt?: string;
  companyName?: string;
  phone?: string;
};

export type FeatureFlagRow = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  owner: string;
};

export type SystemHealth = {
  api: string;
  database: string;
  aiEngine: string;
  email: string;
  defaultGeminiKeyConfigured: boolean;
  openAlerts: number;
  checkedAt: string;
};

export type AnalysisResult = {
  recommendation: "Approve" | "Revise" | "Reject" | "Pilot";
  riskScore: number;
  trustScore: number;
  complianceScore: number;
  roiScore: number;
  humanImpactScore: number;
  bestCase: string;
  likelyCase: string;
  worstCase: string;
  hiddenRisks: string[];
  silentPatterns: string[];
  saferAlternative: string;
  rolloutPlan: string[];
  executiveSummary: string;
  boardroomDebate?: {
    role: "CFO" | "COO" | "CHRO" | "Compliance Head";
    stance: string;
    concern: string;
  }[];
};

export type DecisionPayload = {
  title: string;
  description: string;
  department: string;
  industry: string;
  timeHorizon: 30 | 90 | 365;
  stakeholdersAffected: string;
  budgetImpact: number;
  urgency: "low" | "medium" | "high" | "critical";
  complianceSensitivity: "low" | "medium" | "high";
  currentPainPoint: string;
};

/* ─── Employee Decision Support Types ─── */

export type EmployeeStatus = "active" | "probation" | "pip" | "exited";
export type EvaluationRecommendation = "promote" | "salary_hike" | "pip" | "role_change" | "maintain" | "demote";

export type EmployeeRow = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  status: EmployeeStatus;
  latestEval?: {
    overallScore: number;
    recommendation: EvaluationRecommendation;
  } | null;
};

export type EmployeeDetail = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  status: EmployeeStatus;
};

export type EmployeeRecordRow = {
  _id: string;
  period: string;
  attendanceDays: number;
  totalWorkingDays: number;
  avgLoginTime: string;
  avgLogoutTime: string;
  avgWorkingHours: number;
  tasksAssigned: number;
  tasksCompleted: number;
  qualityScore: number;
  peerRating: number;
  managerRating: number;
  overtimeHours: number;
  leavesUsed: number;
  lateArrivals: number;
};

export type EmployeeEvaluationRow = {
  _id: string;
  employeeRef: string | EmployeeDetail;
  evaluationDate: string;
  periodsCovered: string[];
  attendanceScore: number;
  punctualityScore: number;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  overallScore: number;
  recommendation: EvaluationRecommendation;
  confidenceLevel: number;
  salaryHikePercent?: number | null;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  trendAnalysis: string;
  executiveSummary: string;
  riskFlags: string[];
};

export type WorkforceDashboard = {
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    pipCount: number;
    departmentCount: number;
    avgPerformanceScore: number;
  };
  departments: string[];
  performanceDistribution: { range: string; count: number }[];
  departmentPerformance: { department: string; avgScore: number; count: number }[];
  recommendationBreakdown: { recommendation: string; count: number }[];
  recentEvaluations: EmployeeEvaluationRow[];
};

export type EmployeeListResponse = {
  employees: EmployeeRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type EmployeeDetailResponse = {
  employee: EmployeeDetail;
  records: EmployeeRecordRow[];
  evaluations: EmployeeEvaluationRow[];
};

export type UploadSummary = {
  message: string;
  summary: {
    totalRows: number;
    newEmployees: number;
    recordsCreated: number;
    errorCount: number;
  };
  errors: string[];
};
