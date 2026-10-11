import { Student, AttendanceRecord, SystemSettings, AdminUser, StaffAccount } from '../types/attendance';
import { INITIAL_STUDENTS, DEFAULT_SETTINGS, INITIAL_ATTENDANCE_RECORDS } from '../data/initialStudents';

const STORAGE_KEYS = {
  STUDENTS: 'bsit_b_attendance_students_v1',
  RECORDS: 'bsit_b_attendance_records_v1',
  SETTINGS: 'bsit_b_attendance_settings_v1',
  ADMIN_USER: 'bsit_b_attendance_admin_v1',
  SESSION_AUTH: 'bsit_attendance_session_auth_v1',
  STAFF_ACCOUNTS: 'bsit_b_staff_accounts_v1',
};

export const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'admin',
    role: 'Administrator',
    name: 'System Administrator',
    username: 'Admin',
    password: 'administrator',
  },
  {
    id: 'secretary',
    role: 'Secretary',
    name: 'Class Secretary',
    username: 'Secretary',
    password: 'secretary',
  },
  {
    id: 'asstsecretary',
    role: 'Assistant Secretary',
    name: 'Assistant Secretary',
    username: 'AsstSecretary',
    password: 'assistant',
  },
];

export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load students from storage:', err);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students to storage:', err);
  }
};

export const getStoredRecords = (): AttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      saveRecords(INITIAL_ATTENDANCE_RECORDS);
      return INITIAL_ATTENDANCE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ATTENDANCE_RECORDS;
  } catch (err) {
    console.error('Failed to load attendance records:', err);
    return INITIAL_ATTENDANCE_RECORDS;
  }
};

export const saveRecords = (records: AttendanceRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save records to storage:', err);
  }
};

export const getStoredSettings = (): SystemSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: SystemSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};

export const getStoredAdminUser = (): AdminUser => {
  const isSessionAuth = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEYS.SESSION_AUTH) === 'true';
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
    if (!raw) {
      const defaultAdmin: AdminUser = {
        id: 'admin-01',
        username: 'Admin',
        password: 'administrator',
        name: 'System Administrator',
        gmail: 'admin@gmail.com',
        phone: '+639123456789',
        role: 'Administrator',
        isAuthenticated: isSessionAuth,
      };
      saveAdminUser(defaultAdmin);
      return defaultAdmin;
    }
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      username: parsed.username || 'Admin',
      password: parsed.password || 'administrator',
      gmail: parsed.gmail || 'admin@gmail.com',
      phone: parsed.phone || '+639123456789',
      isAuthenticated: isSessionAuth,
    };
  } catch {
    return {
      id: 'admin-01',
      username: 'Admin',
      password: 'administrator',
      name: 'System Administrator',
      gmail: 'admin@gmail.com',
      phone: '+639123456789',
      role: 'Administrator',
      isAuthenticated: false,
    };
  }
};

export const saveAdminUser = (admin: AdminUser): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(admin));
    if (typeof sessionStorage !== 'undefined') {
      if (admin.isAuthenticated) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_AUTH, 'true');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_AUTH);
      }
    }
  } catch (err) {
    console.error('Failed to save admin user:', err);
  }
};

export const getStoredStaffAccounts = (): StaffAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
    if (!raw) {
      saveStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
      return DEFAULT_STAFF_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
      return DEFAULT_STAFF_ACCOUNTS;
    }
    return DEFAULT_STAFF_ACCOUNTS.map(def => {
      const match = parsed.find((p: any) => p.id === def.id || p.role === def.role);
      return match ? { ...def, ...match } : def;
    });
  } catch {
    return DEFAULT_STAFF_ACCOUNTS;
  }
};

export const saveStaffAccounts = (accounts: StaffAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save staff accounts:', err);
  }
};

export const resetToDefaults = (): void => {
  saveStudents(INITIAL_STUDENTS);
  saveRecords(INITIAL_ATTENDANCE_RECORDS);
  saveSettings(DEFAULT_SETTINGS);
};
