import React from 'react';
import { 
  FileText, 
  Printer, 
  CheckCheck
} from 'lucide-react';
import { Student, AttendanceRecord, SystemSettings } from '../types/attendance';
import { getCurrentEffectiveDateTime } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';
import { ClassListDocument } from './ClassListDocument';

interface AttendanceReportsProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SystemSettings;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

export const AttendanceReports: React.FC<AttendanceReportsProps> = ({
  students,
  records,
  settings,
  onUpdateSettings,
}) => {
  const effective = getCurrentEffectiveDateTime(settings);
  const theme = getThemeConfig(settings.colorTheme);
  const totalStudentsCount = students.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner (Hidden in print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
              <FileText className="w-5 h-5" />
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
              Analytics & Submission Reports
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCheck className="w-3 h-3" />
              <span>Official Class List ({totalStudentsCount} Enrolled)</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            {settings.shortName ? `${settings.shortName} Official Class List` : (settings.systemName || 'Official Class List')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.systemName || 'QR Code-Based Student Attendance Management System'} &bull; {settings.courseName} &bull; Section {settings.sectionName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className={`px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5`}
            title="Print report or save to PDF file"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save to PDF</span>
          </button>
        </div>
      </div>

      {/* Render Official Class List Document */}
      <ClassListDocument 
        students={students} 
        settings={settings} 
        onUpdateSettings={onUpdateSettings} 
      />
    </div>
  );
};
