import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScannerSection } from './components/ScannerSection';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { AttendanceHistory } from './components/AttendanceHistory';
import { AttendanceReports } from './components/AttendanceReports';
import { BatchQRPrintSection } from './components/BatchQRPrintSection';
import { StudentQRModal } from './components/StudentQRModal';
import { DateTimeModal } from './components/DateTimeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LoginScreen } from './components/LoginScreen';
import { ShareLinkModal } from './components/ShareLinkModal';

import { Student, AttendanceRecord, SystemSettings, AdminUser } from './types/attendance';
import { 
  getStoredStudents, 
  saveStudents, 
  getStoredRecords, 
  saveRecords, 
  getStoredSettings, 
  saveSettings, 
  getStoredAdminUser, 
  saveAdminUser, 
  resetToDefaults 
} from './services/storageService';
import { INITIAL_STUDENTS, INITIAL_ATTENDANCE_RECORDS } from './data/initialStudents';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('scanner');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => getStoredRecords());
  const [settings, setSettings] = useState<SystemSettings>(() => getStoredSettings());
  const [adminUser, setAdminUser] = useState<AdminUser>(() => getStoredAdminUser());

  // Modals state
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [isNewlyRegisteredQR, setIsNewlyRegisteredQR] = useState(false);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Handler: Logout & return to login screen
  const handleLogout = () => {
    const loggedOut: AdminUser = { ...adminUser, isAuthenticated: false };
    setAdminUser(loggedOut);
    saveAdminUser(loggedOut);
  };

  // Sync state changes to localStorage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveAdminUser(adminUser);
  }, [adminUser]);

  // Handler: Attendance logged from Scanner
  const handleRecordAttendance = (newRecord: AttendanceRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex(
        (r) => r.studentId === newRecord.studentId && r.date === newRecord.date
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });
  };

  // Handler: Add Student
  const handleAddStudent = (student: Student) => {
    setStudents((prev) => [...prev, student]);
  };

  // Handler: Edit Student
  const handleEditStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    // Also update studentName in records
    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === updatedStudent.id
          ? { ...r, studentName: updatedStudent.name, course: updatedStudent.course, section: updatedStudent.section }
          : r
      )
    );
  };

  // Handler: Delete Student
  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Handler: Update Record from History Sheet
  const handleUpdateRecord = (updatedRecord: AttendanceRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex(
        (r) => r.studentId === updatedRecord.studentId && r.date === updatedRecord.date
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      }
      return [...prev, updatedRecord];
    });
  };

  // Handler: Delete Record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Handler: Batch mark remaining unscanned students as Absent
  const handleBatchMarkAbsent = (date: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      students.forEach((student) => {
        const existingIdx = updated.findIndex(
          (r) => r.studentId === student.id && r.date === date
        );
        if (existingIdx === -1) {
          updated.push({
            id: `${student.id}_${date}`,
            studentId: student.id,
            studentName: student.name,
            course: student.course,
            section: student.section,
            date,
            timeIn: null,
            timeOut: null,
            status: 'Absent',
            remarks: 'Marked absent at session cutoff',
          });
        }
      });
      return updated;
    });
  };

  // Handler: Save Settings
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
  };

  // Handler: Reset Database
  const handleResetDatabase = () => {
    resetToDefaults();
    setStudents(INITIAL_STUDENTS);
    setRecords(INITIAL_ATTENDANCE_RECORDS);
  };

  // Initial Display: Login Screen is displayed first to access the system
  if (!adminUser.isAuthenticated) {
    return (
      <>
        <LoginScreen
          adminUser={adminUser}
          settings={settings}
          onLoginSuccess={(updatedAdmin) => {
            setAdminUser(updatedAdmin);
            saveAdminUser(updatedAdmin);
          }}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
        {isShareModalOpen && (
          <ShareLinkModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            settings={settings}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Wallpaper from Gallery with adjustable dim/overlay */}
      {settings.customBackgroundImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${settings.customBackgroundImage})`,
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Backdrop Dimmer Overlay for accessibility and text contrast */}
          <div
            className="absolute inset-0 bg-slate-950 transition-opacity duration-300"
            style={{ opacity: (settings.backgroundDim ?? 75) / 100 }}
          />
        </div>
      )}

      {/* Main Container Layer above Background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Responsive Navbar with Live/Custom Date-Time display */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          settings={settings}
          adminUser={adminUser}
          onOpenSettings={() => setIsDateTimeModalOpen(true)}
          onToggleAdminLogin={() => setIsAdminModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Body Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full mx-auto">
          {activeTab === 'scanner' && (
            <ScannerSection
              students={students}
              records={records}
              settings={settings}
              onRecordAttendance={handleRecordAttendance}
              onOpenSettings={() => setIsDateTimeModalOpen(true)}
              onUpdateSettings={handleSaveSettings}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              students={students}
              records={records}
              settings={settings}
              onNavigateTab={setActiveTab}
              onOpenSettings={() => setIsDateTimeModalOpen(true)}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              students={students}
              records={records}
              settings={settings}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenQRModal={(s, isNew = false) => {
                setSelectedStudentForQR(s);
                setIsNewlyRegisteredQR(isNew);
              }}
            />
          )}

          {activeTab === 'history' && (
            <AttendanceHistory
              students={students}
              records={records}
              settings={settings}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              onBatchMarkAbsent={handleBatchMarkAbsent}
              onOpenSettings={() => setIsDateTimeModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <AttendanceReports
              students={students}
              records={records}
              settings={settings}
              onUpdateSettings={handleSaveSettings}
            />
          )}

        {activeTab === 'qrcards' && (
          <BatchQRPrintSection
            students={students}
            settings={settings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 no-print w-full">
        <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} &bull; <strong>{settings.schoolName}</strong> &bull; {settings.sectionName}
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>{students.length} Registered Students</span>
            <span>&bull;</span>
            <button
              onClick={() => setIsDateTimeModalOpen(true)}
              className="hover:text-indigo-400 underline"
            >
              Time & Date Controls
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedStudentForQR && (
        <StudentQRModal
          student={selectedStudentForQR}
          settings={settings}
          onClose={() => {
            setSelectedStudentForQR(null);
            setIsNewlyRegisteredQR(false);
          }}
          isNewlyRegistered={isNewlyRegisteredQR}
        />
      )}

      {isDateTimeModalOpen && (
        <DateTimeModal
          isOpen={isDateTimeModalOpen}
          onClose={() => setIsDateTimeModalOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onResetDatabase={handleResetDatabase}
          adminUser={adminUser}
          onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        />
      )}

      {isAdminModalOpen && (
        <AdminLoginModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          adminUser={adminUser}
          onUpdateAdmin={setAdminUser}
        />
      )}

      {isShareModalOpen && (
        <ShareLinkModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          settings={settings}
        />
      )}
      </div>
    </div>
  );
}
