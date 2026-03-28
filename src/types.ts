export type ApplicationStatus = 'Bookmarked' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Archived';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  companyName: string;
  position: string;
  source: string;
  status: ApplicationStatus;
  applicationDate: string;
  salary?: string;
  benefits?: string;
  tags: string[];
  notes?: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  size?: string;
  industry?: string;
  location?: string;
  website?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  companyId?: string;
  notes?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  type: 'Phone Screen' | 'Video Interview' | 'In-person';
  date: string;
  notes?: string;
  questions?: string;
  feedback?: string;
  outcome?: string;
}

export interface Task {
  id: string;
  applicationId?: string;
  title: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
}

export type DocumentType = 'Resume' | 'Cover Letter' | 'Offer Letter' | 'Certification' | 'Portfolio' | 'Other';
export type DocumentCategory = 'General' | 'Application';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  applicationId?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
