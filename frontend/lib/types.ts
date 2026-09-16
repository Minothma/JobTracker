export type ApplicationStatus = 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  version_label: string;
  original_filename: string;
  s3_key: string;
  uploaded_at: string;
  download_url?: string;
  _count?: {
    applications: number;
  };
}

export interface Interview {
  id: string;
  application_id: string;
  round_type: string;
  scheduled_at: string;
  outcome?: 'PASSED' | 'FAILED' | 'PENDING' | string | null;
  notes?: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  application_id: string;
  content: string;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  resume_id?: string | null;
  company_name: string;
  role_title: string;
  status: ApplicationStatus;
  applied_date: string;
  job_posting_url?: string | null;
  created_at: string;
  updated_at: string;
  resumes?: {
    id: string;
    version_label: string;
    original_filename: string;
    download_url?: string;
  } | null;
  interviews?: Interview[];
  notes?: Note[];
  _count?: {
    interviews: number;
    notes: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface FunnelStep {
  stage: string;
  count: number;
  percentage: number;
}

export interface MonthlyVelocityPoint {
  month: string;
  count: number;
}

export interface StaleApplication {
  id: string;
  company_name: string;
  role_title: string;
  applied_date: string;
  days_waiting: number;
}

export interface AnalyticsOverview {
  totalApplications: number;
  activeApplications: number;
  totalInterviewsCount: number;
  applicationsWithInterviews: number;
  totalOffers: number;
  statusCounts: {
    APPLIED: number;
    INTERVIEW: number;
    OFFER: number;
    REJECTED: number;
    WITHDRAWN: number;
    [key: string]: number;
  };
  appliedToInterviewRate: number;
  interviewToOfferRate: number;
  overallOfferRate: number;
  avgDaysToInterview: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  funnel: FunnelStep[];
  monthlyVelocity: MonthlyVelocityPoint[];
  staleApplications: StaleApplication[];
}

export interface NotificationAlertsResponse {
  count: number;
  alerts: StaleApplication[];
}

export interface NotificationCheckResult {
  message: string;
  stale_count: number;
  alerts: StaleApplication[];
  dispatched_via: string;
}

export interface AiMatchResponse {
  score: number;
  verdict: 'STRONG_MATCH' | 'MODERATE_MATCH' | 'NEEDS_IMPROVEMENT';
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  interview_focus_areas: string[];
  summary: string;
  analyzed_with: string;
}
