export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';

export type ScanMode = 'auto' | 'time_in' | 'time_out';

export interface Student {
  id: string; // e.g., '20261671477'
  name: string; // e.g., 'ALAGAN, CHERUBIM GIAN A.'
  course: string; // 'BSIT'
  section: string; // 'Set B'
  email?: string;
  contactNumber?: string;
  avatarUrl?: string;
  notes?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string; // unique record id (e.g., studentId + '_' + date)
  studentId: string;
  studentName: string;
  course: string;
  section: string;
  date: string; // YYYY-MM-DD or formatted 'Sept. 26, 2026'
  timeIn: string | null; // e.g., '07:25 AM'
  timeOut: string | null; // e.g., '04:30 PM'
  status: AttendanceStatus;
  remarks?: string;
  verifiedBy?: string;
  timestampIn?: number;
  timestampOut?: number;
}

export type ColorTheme = 'indigo' | 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';

export interface SystemSettings {
  systemName: string; // e.g. 'QR Code-Based BSIT Set B Student Attendance Management System'
  shortName: string; // e.g. 'BSIT Set B MS'
  useCustomDateTime: boolean;
  customDate: string; // 'YYYY-MM-DD'
  customTime: string; // 'HH:mm'
  lateCutoffTime: string; // '07:30' (24hr format)
  autoTimeOutTime: string; // '17:00'
  courseName: string; // 'BS Information Technology'
  sectionName: string; // 'BSIT Set B MS'
  schoolName: string; // 'College of Information Technology & Computing'
  semester: string; // '1st Semester, A.Y. 2026-2027'
  instructorName: string; // 'Instructor / Professor'
  allowSelfCheckout: boolean;
  soundEnabled: boolean;
  // Continuous scanning feature
  autoClearScanInput: boolean; // Automatically clear scanner state after successful scan
  autoClearDelayMs: number; // Duration before resetting scan result card (e.g. 1500ms)
  // Theme and Background customization
  colorTheme: ColorTheme;
  customBackgroundImage?: string; // Data URL or image URL from gallery/files
  backgroundDim: number; // 0 to 90 percent opacity overlay
  // Professional Class List Document & Logo customization
  schoolLogoUrl?: string; // Data URL or URL of the school logo
  schoolLocation?: string; // Location beside school name (e.g. 'Koronadal City, South Cotabato')
  classListTitle?: string; // Centered bold class-list title (e.g. 'BSIT1167MS B Class List')
  academicYear?: string; // Academic Year (e.g. 'Academic Year 2026-2027')
  degreeProgram?: string; // Degree / Program (e.g. 'Bachelor of Science in Information Technology (BSIT)')
  campusBranch?: string; // Campus / Branch (e.g. 'Koronadal City Campus')
  documentFontFamily?: 'serif' | 'sans' | 'mono'; // Formal text design
  documentTitleTracking?: 'normal' | 'wide' | 'widest'; // Title letter spacing
  documentBorderColor?: 'gray-200' | 'gray-300' | 'gray-400'; // Thin border tint
  documentDensity?: 'compact' | 'normal' | 'spacious'; // Row spacing density
  systemUrl?: string; // Custom web application URL
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  gmail?: string;
  phone?: string;
  role: 'Administrator' | 'Secretary' | 'Assistant Secretary' | 'Instructor' | 'Officer';
  isAuthenticated: boolean;
}

export interface StaffAccount {
  id: 'admin' | 'secretary' | 'asstsecretary';
  role: 'Administrator' | 'Secretary' | 'Assistant Secretary';
  name: string;
  username: string;
  password: string;
}
