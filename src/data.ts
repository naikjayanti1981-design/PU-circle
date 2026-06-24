import { PUSubject, CircularNotification, StudyMaterial } from './types';

export const PU_SUBJECTS: PUSubject[] = [
  // Science
  { code: 'PHY', name: 'Physics', stream: 'Science' },
  { code: 'CHE', name: 'Chemistry', stream: 'Science' },
  { code: 'MAT', name: 'Mathematics', stream: 'Science' },
  { code: 'BIO', name: 'Biology', stream: 'Science' },
  { code: 'CS', name: 'Computer Science', stream: 'Science' },
  { code: 'ELE', name: 'Electronics', stream: 'Science' },
  
  // Commerce
  { code: 'ACC', name: 'Accountancy', stream: 'Commerce' },
  { code: 'BST', name: 'Business Studies', stream: 'Commerce' },
  { code: 'ECO', name: 'Economics', stream: 'Commerce' },
  { code: 'STAT', name: 'Statistics', stream: 'Commerce' },
  { code: 'CA', name: 'Computer Applications', stream: 'Commerce' },

  // Arts
  { code: 'HIS', name: 'History', stream: 'Arts' },
  { code: 'POL', name: 'Political Science', stream: 'Arts' },
  { code: 'SOC', name: 'Sociology', stream: 'Arts' },
  { code: 'GEO', name: 'Geography', stream: 'Arts' },

  // Languages / General
  { code: 'ENG', name: 'English', stream: 'General' },
  { code: 'KAN', name: 'Kannada', stream: 'General' },
  { code: 'HIN', name: 'Hindi', stream: 'General' },
  { code: 'SANS', name: 'Sanskrit', stream: 'General' },
];

export const INITIAL_CIRCULARS: CircularNotification[] = [];

export const INITIAL_MATERIALS: StudyMaterial[] = [];
