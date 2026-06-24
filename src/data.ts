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

export const INITIAL_CIRCULARS: CircularNotification[] = [
  {
    id: 'circ-1',
    title: 'Release of Class 12 / 2nd PU Model Question Papers for Board Exams',
    description: 'The Department of Pre-University Education (DPUE) has officially uploaded the model question papers with updated blueprint structures for the upcoming board exams. Students are advised to download the blueprints and plan their revisions accordingly.',
    postedDate: '2026-06-20',
    isOfficial: true,
    authority: 'Department of PU Education (DPUE)',
    category: 'Exams',
    important: true,
  },
  {
    id: 'circ-2',
    title: 'Practical Examination Guidelines & Directives',
    description: 'Guidelines and manual directions for conducting the 1st PU & 2nd PU Practical Examinations. Contains mark allocation schema, laboratory attendance registry criteria, and internal examiner selection workflows.',
    postedDate: '2026-06-15',
    isOfficial: true,
    authority: 'DPUE Board Office',
    category: 'Practicals',
    important: true,
  },
  {
    id: 'circ-3',
    title: 'Registration Card Correction Notice for PU Colleges',
    description: 'Pre-University Colleges have been granted a final window to perform spelling corrections, language selections, and stream modifications on Student Registration Certificates via the SATS portal.',
    postedDate: '2026-06-08',
    isOfficial: true,
    authority: 'DPUE SATS Portal',
    category: 'Administration',
    important: false,
  },
  {
    id: 'circ-4',
    title: 'Annual Academic Calendar & Holiday Declarations',
    description: 'Official academic timetable outlines the term schedules, mid-term break, and preparatory examination slots for Science, Commerce, and Arts cohorts for the current academic session.',
    postedDate: '2026-06-01',
    isOfficial: true,
    authority: 'Pre-University Board',
    category: 'Academic',
    important: false,
  }
];

export const INITIAL_MATERIALS: StudyMaterial[] = [];
