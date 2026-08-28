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
