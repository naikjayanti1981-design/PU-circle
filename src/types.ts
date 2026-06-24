export type PUClass = '1st PU' | '2nd PU';

export type PUStream = 'Science' | 'Commerce' | 'Arts' | 'General';

export type MaterialCategory = 'Circular' | 'Notes' | 'Question Paper' | 'Syllabus & Blueprint';

export type PUModule = string;

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: PUClass;
  stream: PUStream;
  category: MaterialCategory;
  modulePartition?: PUModule;
  uploader: string;
  uploaderEmail: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
  fileName: string;
  filePath?: string;
  downloadUrl?: string; // e.g. /api/download/:id
  content?: string; // Optional raw contents or description text
  likes: number;
  downloads: number;
  isCustom?: boolean; // Indicates if user-uploaded
}

export interface UserComment {
  id: string;
  targetId: string; // resource ID or circular ID or 'general'
  author: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

export interface CircularNotification {
  id: string;
  title: string;
  description: string;
  postedDate: string;
  isOfficial: boolean;
  authority: string; // e.g. "DUE Board", "PU Circle Admin"
  category: string; // e.g. "Exams", "Admissions", "Syllabus"
  important: boolean;
  downloadUrl?: string;
}

export interface PUSubject {
  code: string;
  name: string;
  stream: PUStream;
}
