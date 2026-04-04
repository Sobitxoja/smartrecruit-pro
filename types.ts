
export enum UserRole {
  SEEKER = 'SEEKER',
  EMPLOYER = 'EMPLOYER'
}

export enum ApplicationStatus {
  INVITED = 'INVITED',
  PENDING = 'PENDING',
  INTERVIEW = 'INTERVIEW', // Kept for backward compatibility
  DECLINED = 'DECLINED',
  OFFER = 'OFFER',
  HIRED = 'HIRED'
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

export interface Location {
  country: string;
  city: string;
}

export interface JobLocation extends Location {
  workModes: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  skills?: string[];
  experienceList?: WorkExperience[];
  bio?: string;
  companyName?: string;
  appliedJobIds?: string[];
  preferredLocations?: JobLocation[]; // Consolidated location & work modes
  openToRelocation?: boolean;
  isVerified?: boolean;
  companyLocation?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;
  companyWorkModes?: string[];
  preferredRole?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'normal' | 'system' | 'invitation';
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  status: ApplicationStatus;
  appliedAt: string;
  messages: Message[];
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
  active: boolean;
  experienceRequired: {
    amount: number;
    unit: 'months' | 'years';
  } | null; // null means Entry Level
  locations: JobLocation[]; // Includes workModes per location
}

export interface MatchResult {
  candidateId: string;
  score: number;
  reasoning: string;
}
