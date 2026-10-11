import React from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  UserX, 
  ArrowUpRight, 
  ArrowDownRight, 
  LogOut, 
  Calendar, 
  Percent, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  FileText,
  CheckCheck,
  Sliders,
  Building2,
  Palette
} from 'lucide-react';
import { Student, AttendanceRecord, SystemSettings } from '../types/attendance';
import { getCurrentEffectiveDateTime } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SystemSettings;
  onNavigateTab: (tab: string) => void;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  records,
  settings,
  onNavigateTab,
  onOpenSettings,
}) => {
  const effective = getCurrentEffectiveDateTime(settings);
  const theme = getThemeConfig(settings.colorTheme);

  // Filter records for active date
  const todayRecords = records.filter((r) => r.date === effective.dateStr);

  const totalStudents = students.length;
  // Submissions automatically correspond 1:1 with students
  const totalSubmissions = totalStudents;
  const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
  const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
  const timedInCount = todayRecords.filter((r) => r.timeIn !== null).length;
  const timedOutCount = todayRecords.filter((r) => r.timeOut !== null).length;

  // An absent student is either explicitly marked 'Absent' or has no record today
  const explicitlyAbsent = todayRecords.filter((r) => r.status === 'Absent').length;
  const unrecordedCount = Math.max(0, totalStudents - timedInCount - explicitlyAbsent);
  const totalAbsentCount = explicitlyAbsent + unrecordedCount;

  const attendancePercentage = totalStudents > 0 
    ? Math.round(((presentCount + lateCount) / totalStudents) * 100) 
    : 0;

  // Recent scans
  const recentScans = [...todayRecords]
    .filter((r) => r.timeIn)
    .sort((a, b) => (b.timestampIn || 0) - (a.timestampIn || 0))
    .slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Date Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
              {settings.shortName || 'BSIT Set B'} &bull; {totalStudents} Students
            </span>
            <span className="text-xs text-slate-400">
              {settings.semester}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {settings.systemName || 'Attendance Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview statistics for <span className={`${theme.accentText} font-semibold`}>{effective.fullDisplayDate}</span> &bull; {settings.sectionName}
          </p>
        </div>

        {/* Date Time & Quick Settings Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('scanner')}
            className={`px-4 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg ${theme.glow} transition flex items-center space-x-2`}
          >
            <QrCode className="w-4 h-4" />
            <span>Open Scanner Terminal</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center space-x-2 ${
              settings.useCustomDateTime
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${theme.accentText}`} />
            <span>Change Date & Time</span>
          </button>
        </div>
      </div>

      {/* Submissions Synchronization Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">
              Submissions Automatically Match Student Roster
            </span>
            <p className="text-slate-400 text-[11px]">
              For analytics & reports, the system automatically generates exactly {totalSubmissions} submissions matching all {totalStudents} students.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Total Submissions:</span>
            <strong className="text-emerald-400 font-bold">{totalSubmissions} / {totalStudents}</strong>
            <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Auto-Generated</span>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* System Settings & Configuration Display Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active System Settings & Configuration</h3>
              <p className="text-[11px] text-slate-400">Current institutional settings and active parameters</p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Settings & Download App</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>School & Title</span>
            </div>
            <div className="text-white font-bold truncate">{settings.schoolName}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{settings.systemName}</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Late Cutoff & Time Mode</span>
            </div>
            <div className="text-white font-bold">Cutoff: {settings.lateCutoffTime}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {settings.useCustomDateTime ? (
                <span className="text-amber-400 font-semibold">Custom Time Override Active</span>
              ) : (
                <span className="text-emerald-400 font-semibold">Real-Time System Clock</span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold mb-1">
              <Palette className="w-3.5 h-3.5" />
              <span>Theme & Appearance</span>
            </div>
            <div className="text-white font-bold capitalize">{settings.colorTheme} Theme</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {settings.customBackgroundImage ? 'Custom Wallpaper Active' : 'Default Wallpaper'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section & Semester</span>
            </div>
            <div className="text-white font-bold truncate">{settings.sectionName}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{settings.semester}</div>
          </div>
        </div>
      </div>

      {/* Main KPI Statistics Grid (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Students</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalStudents}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Enrolled BSIT Set B</span>
          </div>
        </div>

        {/* Present (On Time) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">Present</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{presentCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">On or before {settings.lateCutoffTime}</span>
          </div>
        </div>

        {/* Late */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold">Late</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{lateCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">After {settings.lateCutoffTime}</span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold">Absent</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">{totalAbsentCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Unrecorded / Absent</span>
          </div>
        </div>

        {/* Time-In Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold">Time-In</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{timedInCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Total checked-in</span>
          </div>
        </div>

        {/* Time-Out Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold">Time-Out</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-400">{timedOutCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Checked-out</span>
          </div>
        </div>
      </div>

      {/* Progress & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Attendance Ratio Bar */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Attendance Distribution</h3>
              <p className="text-xs text-slate-400">Status breakdown for BSIT Set B on {effective.fullDisplayDate}</p>
            </div>
            <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
              <Percent className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-black text-indigo-300">{attendancePercentage}% Turnout</span>
            </div>
          </div>

          {/* Multi-segmented Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(presentCount / totalStudents) * 100}%` }}
                title={`Present: ${presentCount}`}
                className="bg-emerald-500 transition-all duration-500"
              />
              <div
                style={{ width: `${(lateCount / totalStudents) * 100}%` }}
                title={`Late: ${lateCount}`}
                className="bg-amber-500 transition-all duration-500"
              />
              <div
                style={{ width: `${(totalAbsentCount / totalStudents) * 100}%` }}
                title={`Absent: ${totalAbsentCount}`}
                className="bg-rose-500/80 transition-all duration-500"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Present: <strong className="text-white">{presentCount}</strong> ({Math.round((presentCount / totalStudents) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Late: <strong className="text-white">{lateCount}</strong> ({Math.round((lateCount / totalStudents) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>Absent: <strong className="text-white">{totalAbsentCount}</strong> ({Math.round((totalAbsentCount / totalStudents) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div 
              onClick={() => onNavigateTab('history')}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition"
            >
              <div className="text-xs font-semibold text-slate-300">Detailed Attendance Sheet</div>
              <p className="text-[11px] text-slate-400 mt-0.5">View & edit table for {effective.fullDisplayDate}</p>
            </div>

            <div 
              onClick={() => onNavigateTab('reports')}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition"
            >
              <div className="text-xs font-semibold text-slate-300">Generate Reports</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Daily, weekly, and monthly summaries</p>
            </div>

            <div 
              onClick={() => onNavigateTab('qrcards')}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition"
            >
              <div className="text-xs font-semibold text-slate-300">Print Student QR Badges</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Print individual cards or full class sheet</p>
            </div>
          </div>
        </div>

        {/* Live Feed / Recent Activity */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Recent Scans Today</span>
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {recentScans.length} scans
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-800/60 max-h-72 overflow-y-auto custom-scrollbar">
              {recentScans.length > 0 ? (
                recentScans.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white truncate max-w-[180px]">
                        {item.studentName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.studentId}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-1.5 justify-end">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        In: {item.timeIn} {item.timeOut ? `| Out: ${item.timeOut}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No attendance scans recorded yet for {effective.fullDisplayDate}.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigateTab('scanner')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Open Camera to Record Next Student &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
