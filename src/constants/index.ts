import { ApplicationStatus, DocumentType, DocumentCategory } from '../types';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Bookmarked', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Archived'
];

export const STAGE_COLORS: Record<ApplicationStatus, string> = {
  'Bookmarked': 'bg-gray-100 text-gray-600',
  'Applied': 'bg-blue-100 text-blue-600',
  'Phone Screen': 'bg-indigo-100 text-indigo-600',
  'Interview': 'bg-purple-100 text-purple-600',
  'Offer': 'bg-green-100 text-green-600',
  'Rejected': 'bg-red-100 text-red-600',
  'Archived': 'bg-gray-200 text-gray-500'
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'Resume', 'Cover Letter', 'Offer Letter', 'Certification', 'Portfolio', 'Other'
];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = ['General', 'Application'];

export const TYPE_COLORS: Record<DocumentType, string> = {
  'Resume': 'bg-blue-100 text-blue-600',
  'Cover Letter': 'bg-green-100 text-green-600',
  'Offer Letter': 'bg-purple-100 text-purple-600',
  'Certification': 'bg-orange-100 text-orange-600',
  'Portfolio': 'bg-pink-100 text-pink-600',
  'Other': 'bg-gray-100 text-gray-600'
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  'General': 'bg-gray-50 text-gray-600',
  'Application': 'bg-blue-50 text-blue-600'
};

export const PRIORITY_COLORS: Record<'High' | 'Medium' | 'Low', string> = {
  'High': 'text-red-500 bg-red-50',
  'Medium': 'text-amber-500 bg-amber-50',
  'Low': 'text-blue-500 bg-blue-50'
};
