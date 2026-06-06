export type JobStatus = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  status: JobStatus;
  url?: string;
  description?: string;
  intel_kit?: GenerateKitResponse;
  created_at: string;
}

export interface UserProfile {
  id: string;
  resume_text?: string;
  resume_pdf_url?: string;
  target_job_title?: string;
  location?: string;
  email?: string;
}

export interface GenerateKitResponse {
  cover_letter: string;
  resume_bullets: string[];
  interview_questions: string[];
  company_brief: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}
