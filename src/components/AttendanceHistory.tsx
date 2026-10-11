import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  UserX, 
  Filter, 
  X, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Student, AttendanceRecord, SystemSettings, AttendanceStatus } from '../types/attendance';
import { getCurrentEffectiveDateTime, formatDateToWords } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';
import { exportAttendanceLogPDF } from '../utils/pdfExport';

interface AttendanceHistoryProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SystemSettings;
  onUpdateRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onBatchMarkAbsent: (date: string) => void;
  onOpenSettings: () => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  students,
  records,
  settings,
  onUpdateRecord,
  onDeleteRecord,
  onBatchMarkAbsent,
  onOpenSettings,
}) => {
  const effective = getCurrentEffectiveDateTime(settings);
  const theme = getThemeConfig(settings.colorTheme);
  const [selectedDate, setSelectedDate] = useState<string>(effective.dateStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AttendanceStatus>('All');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Edit form state
  const [editTimeIn, setEditTimeIn] = useState('');
  const [editTimeOut, setEditTimeOut] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Present');
  const [editRemarks, setEditRemarks] = useState('');

  // Collect all unique dates recorded in history + current date
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    dates.add(effective.dateStr);
    dates.add('2026-09-26');
    records.forEach((r) => {
      if (r.date) dates.add(r.date);
    });
    return Array.from(dates).sort().reverse();
  }, [records, effective.dateStr]);

  // Generate complete attendance list for selectedDate (merging all 68 students)
  const fullAttendanceList = useMemo(() => {
    return students.map((student) => {
      const existing = records.find(
        (r) => r.studentId === student.id && r.date === selectedDate
      );
      if (existing) {
        return existing;
      }
      // If not yet recorded, default display as Absent for this date
      const virtualAbsent: AttendanceRecord = {
        id: `${student.id}_${selectedDate}`,
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        section: student.section,
        date: selectedDate,
        timeIn: null,
        timeOut: null,
        status: 'Absent',
        remarks: 'No scan logged',
      };
      return virtualAbsent;
    });
  }, [students, records, selectedDate]);

  // Filtered by search and status
  const filteredList = useMemo(() => {
    return fullAttendanceList.filter((rec) => {
      const matchesSearch =
        rec.studentId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesStatus =
        statusFilter === 'All' ? true : rec.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fullAttendanceList, searchQuery, statusFilter]);

  // Statistics for active selected date
  const totalCount = fullAttendanceList.length;
  const presentCount = fullAttendanceList.filter((r) => r.status === 'Present').length;
  const lateCount = fullAttendanceList.filter((r) => r.status === 'Late').length;
  const absentCount = fullAttendanceList.filter((r) => r.status === 'Absent').length;

  // Edit record
  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditTimeIn(rec.timeIn || '');
    setEditTimeOut(rec.timeOut || '');
    setEditStatus(rec.status);
    setEditRemarks(rec.remarks || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const updated: AttendanceRecord = {
      ...editingRecord,
      timeIn: editTimeIn.trim() || null,
      timeOut: editTimeOut.trim() || null,
      status: editStatus,
      remarks: editRemarks.trim() || undefined,
    };

    onUpdateRecord(updated);
    setEditingRecord(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No.', 'Student ID', 'Name', 'Date', 'Time In', 'Time Out', 'Status', 'Remarks'];
    const rows = fullAttendanceList.map((r, idx) => [
      idx + 1,
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${formatDateToWords(r.date)}"`,
      `"${r.timeIn || '—'}"`,
      `"${r.timeOut || '—'}"`,
      `"${r.status}"`,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BSIT_Set_B_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print attendance sheet
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF
  const handleExportPDF = () => {
    const recordsToExport = filteredList.length > 0 ? filteredList : fullAttendanceList;
    exportAttendanceLogPDF({
      records: recordsToExport,
      selectedDate,
      settings,
      customTitle: `${settings.classListTitle || 'BSIT1167MS B'} Attendance Log`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner (Hidden in print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
              <Calendar className="w-5 h-5" />
            </span>
            <span className={`text-xs font-bold ${theme.accentText} uppercase tracking-wider`}>
              Attendance Records & Master Sheet
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Attendance Log: {formatDateToWords(selectedDate)}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            BSIT Set B &bull; {totalCount} Enrolled Students
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onBatchMarkAbsent(selectedDate)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
            title="Mark any unrecorded student as Absent for this date"
          >
            Mark All Unscanned as Absent
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
            title="Export Attendance Log as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white border border-red-500/50 text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
            title="Export Attendance Log as PDF"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className={`px-4 py-2 rounded-xl ${theme.primaryButton} ${theme.primaryButtonHover} text-white text-xs font-bold shadow-lg ${theme.glow} transition flex items-center space-x-1.5`}
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Sheet</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Status Selector Bar (Hidden in print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-400">Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDateToWords(d)} ({d})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>

        {/* Status Badges Filter */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['All', 'Present', 'Late', 'Absent'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Summary Chips for the chosen date (Hidden in print) */}
      <div className="grid grid-cols-4 gap-3 text-xs no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
          <span className="text-slate-400 font-medium">Total:</span>
          <span className="font-bold text-white text-base">{totalCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
          <span className="text-emerald-400 font-medium">Present:</span>
          <span className="font-bold text-emerald-400 text-base">{presentCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
          <span className="text-amber-400 font-medium">Late:</span>
          <span className="font-bold text-amber-400 text-base">{lateCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
          <span className="text-rose-400 font-medium">Absent:</span>
          <span className="font-bold text-rose-400 text-base">{absentCount}</span>
        </div>
      </div>

      {/* Printable Sheet Header (Visible during Print only) */}
      <div className="hidden print:block text-black p-6 border-b-2 border-black space-y-2">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold uppercase tracking-wider">{settings.schoolName}</h2>
          <h3 className="text-base font-bold">{settings.systemName || settings.courseName}</h3>
          <h4 className="text-sm font-semibold">Course: {settings.courseName} &bull; Section: {settings.sectionName}</h4>
          <p className="text-xs">{settings.semester}</p>
        </div>
        <div className="flex justify-between items-center pt-3 text-xs font-medium">
          <div>
            <strong>Attendance Date:</strong> {formatDateToWords(selectedDate)}
          </div>
          <div>
            <strong>Instructor:</strong> {settings.instructorName}
          </div>
          <div>
            <strong>Generated on:</strong> {effective.fullDisplayDate} {effective.timeStr12}
          </div>
        </div>
      </div>

      {/* Main Table Matching the User Request Format */}
      <div className="bg-slate-900 print:bg-white border border-slate-800 print:border-black rounded-2xl shadow-xl overflow-hidden print:rounded-none">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm print:text-xs">
            <thead>
              <tr className="border-b border-slate-800 print:border-black bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-black font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time In</th>
                <th className="py-3 px-4">Time Out</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-black">
              {filteredList.map((rec, idx) => (
                <tr
                  key={rec.studentId}
                  className="hover:bg-slate-800/40 print:hover:bg-transparent transition duration-150"
                >
                  <td className="py-2.5 px-4 text-center text-slate-500 print:text-black font-mono text-xs">
                    {idx + 1}
                  </td>

                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-300 print:text-black">
                    {rec.studentId}
                  </td>

                  <td className="py-2.5 px-4 font-semibold text-white print:text-black">
                    {rec.studentName}
                  </td>

                  <td className="py-2.5 px-4 text-slate-400 print:text-black">
                    {formatDateToWords(rec.date)}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-emerald-400 print:text-black font-semibold">
                    {rec.timeIn || '—'}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-indigo-400 print:text-black font-semibold">
                    {rec.timeOut || '—'}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-black print:text-black'
                          : rec.status === 'Late'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 print:border-black print:text-black'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 print:border-black print:text-black'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-right no-print">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="Edit this record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Sheet Signatures Footer (Visible in Print only) */}
      <div className="hidden print:flex justify-between items-end pt-12 px-6 text-black text-xs">
        <div className="text-center space-y-1">
          <div className="w-52 border-b border-black mb-1"></div>
          <p className="font-bold">Class Representative / Officer</p>
          <p className="text-[10px] text-gray-600">BSIT Set B</p>
        </div>

        <div className="text-center space-y-1">
          <div className="w-52 border-b border-black mb-1"></div>
          <p className="font-bold">{settings.instructorName}</p>
          <p className="text-[10px] text-gray-600">Subject Instructor</p>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Manual Record Adjustment</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Student</span>
                <p className="font-bold text-white text-sm mt-0.5">{editingRecord.studentName}</p>
                <p className="font-mono text-indigo-300 text-xs">{editingRecord.studentId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Time In</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:25 AM"
                    value={editTimeIn}
                    onChange={(e) => setEditTimeIn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Time Out</label>
                  <input
                    type="text"
                    placeholder="e.g. 04:30 PM"
                    value={editTimeOut}
                    onChange={(e) => setEditTimeOut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Attendance Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Remarks / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Manual correction, medical slip, etc."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteRecord(editingRecord.id);
                    setEditingRecord(null);
                  }}
                  className="px-3 py-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold"
                >
                  Clear Record
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
