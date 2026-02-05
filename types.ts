
export enum UserRole {
  SEEKER = 'SEEKER',
  EMPLOYER = 'EMPLOYER'
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skills?: string[];
  experienceList?: WorkExperience[];
  bio?: string;
  companyName?: string;
  appliedJobIds?: string[];
}

export interface JobLocation {
  type: 'on-site' | 'remote' | 'hybrid';
  country?: string;
  city?: string;
  anywhere?: boolean;
}

export interface Job {
  id: string;
  employerId: string;
  companyName: string;
  title: string;
  description: string;
  requirements: string[];
  postedAt: string;
  salary: string;
  experienceRequired: {
    amount: number;
    unit: 'months' | 'years';
  } | null; // null means Entry Level
  locations: JobLocation[];
}

export interface MatchResult {
  candidateId: string;
  score: number;
  reasoning: string;
}
