import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  QrCode, 
  Edit2, 
  Trash2, 
  Download, 
  X, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  CheckCircle,
  RefreshCw,
  Camera,
  User,
  Image as ImageIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student, AttendanceRecord, SystemSettings } from '../types/attendance';
import { getCurrentEffectiveDateTime } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';
import { exportStudentDirectoryPDF } from '../utils/pdfExport';
import { StudentPhotoModal } from './StudentPhotoModal';

interface StudentManagementProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SystemSettings;
  onAddStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenQRModal: (student: Student, isNew?: boolean) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  records,
  settings,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenQRModal,
}) => {
  const theme = getThemeConfig(settings.colorTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Late' | 'Absent'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentForPhoto, setSelectedStudentForPhoto] = useState<Student | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCourse, setFormCourse] = useState('BSIT');
  const [formSection, setFormSection] = useState('Set B');
  const [formEmail, setFormEmail] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formError, setFormError] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string | undefined>(undefined);
  const [liveQrPreviewUrl, setLiveQrPreviewUrl] = useState<string>('');

  const effective = getCurrentEffectiveDateTime(settings);

  // Helper: auto-generate next sequential student ID
  const generateNextStudentId = () => {
    const numericIds = students
      .map((s) => parseInt(s.id, 10))
      .filter((n) => !isNaN(n) && n > 2000000000);
    if (numericIds.length > 0) {
      const maxId = Math.max(...numericIds);
      return String(maxId + 1);
    }
    return `20261671${String(students.length + 1).padStart(3, '0')}`;
  };

  // Real-time automatic QR code generation as the Student ID is inputted
  useEffect(() => {
    const trimmedId = formId.trim();
    if (trimmedId) {
      QRCode.toDataURL(trimmedId, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setLiveQrPreviewUrl(url))
        .catch(() => setLiveQrPreviewUrl(''));
    } else {
      setLiveQrPreviewUrl('');
    }
  }, [formId]);

  // Status mapping for today
  const studentStatusMap = useMemo(() => {
    const map = new Map<string, 'Present' | 'Late' | 'Absent' | 'Excused'>();
    students.forEach((s) => {
      const rec = records.find((r) => r.studentId === s.id && r.date === effective.dateStr);
      map.set(s.id, rec ? (rec.status as 'Present' | 'Late' | 'Absent' | 'Excused') : 'Absent');
    });
    return map;
  }, [students, records, effective.dateStr]);

  // Filter students based on search query (name or ID) and status filter
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusFilter !== 'all') {
        const status = studentStatusMap.get(s.id) || 'Absent';
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [students, searchQuery, statusFilter, studentStatusMap]);

  // Counts for quick filter tabs
  const counts = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    students.forEach((s) => {
      const st = studentStatusMap.get(s.id) || 'Absent';
      if (st === 'Present') presentCount++;
      else if (st === 'Late') lateCount++;
      else absentCount++;
    });
    return {
      all: students.length,
      Present: presentCount,
      Late: lateCount,
      Absent: absentCount,
    };
  }, [students, studentStatusMap]);

  const openAddModal = () => {
    const nextId = generateNextStudentId();
    setFormId(nextId);
    setFormName('');
    setFormCourse('BSIT');
    setFormSection('Set B');
    setFormEmail('');
    setFormContact('');
    setFormAvatarUrl(undefined);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormId(student.id);
    setFormName(student.name);
    setFormCourse(student.course);
    setFormSection(student.section);
    setFormEmail(student.email || '');
    setFormContact(student.contactNumber || '');
    setFormAvatarUrl(student.avatarUrl);
    setFormError('');
  };

  // Handler to update a student's profile photo from camera or gallery
  const handleSavePhoto = (studentId: string, photoDataUrl: string | undefined) => {
    // If currently editing or adding in the student modal, update the form's avatar state
    if (isAddModalOpen || editingStudent) {
      setFormAvatarUrl(photoDataUrl);
    }

    // Find and update existing student if found
    const targetStudent = students.find((s) => s.id === studentId);
    if (targetStudent) {
      onEditStudent({
        ...targetStudent,
        avatarUrl: photoDataUrl,
      });
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formId.trim()) {
      setFormError('Student ID is required.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Student Name is required.');
      return;
    }

    if (editingStudent) {
      // Editing existing student
      onEditStudent({
        ...editingStudent,
        name: formName.trim().toUpperCase(),
        course: formCourse.trim() || 'BSIT',
        section: formSection.trim() || 'Set B',
        email: formEmail.trim() || undefined,
        contactNumber: formContact.trim() || undefined,
        avatarUrl: formAvatarUrl,
      });
      setEditingStudent(null);
    } else {
      // Adding new student: check uniqueness of Student ID
      const exists = students.some((s) => s.id === formId.trim());
      if (exists) {
        setFormError('A student with this Student ID already exists.');
        return;
      }

      const newStudent: Student = {
        id: formId.trim(),
        name: formName.trim().toUpperCase(),
        course: formCourse.trim() || 'BSIT',
        section: formSection.trim() || 'Set B',
        email: formEmail.trim() || undefined,
        contactNumber: formContact.trim() || undefined,
        avatarUrl: formAvatarUrl,
        createdAt: new Date().toISOString(),
      };

      onAddStudent(newStudent);
      setIsAddModalOpen(false);
      // Automatically generate & open the new student's QR code modal immediately!
      onOpenQRModal(newStudent, true);
    }
  };

  // Export student directory as CSV
  const exportStudentsCSV = () => {
    const headers = ['No.', 'Student ID', 'Full Name', 'Course', 'Section', 'Email', 'Contact'];
    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.course}"`,
      `"${s.section}"`,
      `"${s.email || ''}"`,
      `"${s.contactNumber || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BSIT_Set_B_Students_${students.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export student directory as PDF
  const exportStudentsPDF = () => {
    const studentsToExport = filteredStudents.length > 0 ? filteredStudents : students;
    exportStudentDirectoryPDF({
      students: studentsToExport,
      records,
      settings,
      customTitle: `${settings.classListTitle || 'BSIT1167MS B'} Student Registration & Directory`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className={`text-xs font-bold ${theme.accentText} uppercase tracking-wider`}>
              Student Masterlist &bull; BSIT Set B
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Student Registration & Directory ({students.length})
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage students, generate individual QR codes, or add new enrollees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportStudentsCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
            title="Export Student Directory as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportStudentsPDF}
            className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white border border-red-500/50 text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
            title="Export Student Registration & Directory as PDF"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={openAddModal}
            className={`px-4 py-2 rounded-xl ${theme.primaryButton} ${theme.primaryButtonHover} text-white text-xs font-bold shadow-lg ${theme.glow} transition flex items-center space-x-1.5`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Now</span>
          </button>
        </div>
      </div>

      {/* Quick Register Link Banner */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3 text-indigo-200">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Student Registration & Directory Portal</h4>
            <p className="text-[11px] text-indigo-300/80">Easily register new students, generate custom QR ID badges, or manage active enrollment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Now</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Search Input Field: Name or Student ID */}
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-indigo-400" />
            </div>
            <input
              type="text"
              placeholder="Search student by name or student ID (e.g., 20261671477 or AGANAP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search (Esc)"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Result counter indicator */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
            <span className="text-slate-400">
              Showing <strong className="text-white font-mono">{filteredStudents.length}</strong> of{' '}
              <strong className="text-white font-mono">{students.length}</strong> students
            </span>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pills (All, Present, Late, Absent) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
            <span>Filter Status:</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? `${theme.primaryButton} text-white shadow-sm`
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>All Students</span>
            <span className="font-mono text-[10px] opacity-80">({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Present')}
            className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
              statusFilter === 'Present'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/30'
            }`}
          >
            <span>Present Today</span>
            <span className="font-mono text-[10px] opacity-80">({counts.Present})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Late')}
            className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
              statusFilter === 'Late'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800 hover:border-amber-500/30'
            }`}
          >
            <span>Late Today</span>
            <span className="font-mono text-[10px] opacity-80">({counts.Late})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Absent')}
            className={`px-3 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1.5 ${
              statusFilter === 'Absent'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-950 text-rose-400/80 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30'
            }`}
          >
            <span>Absent Today</span>
            <span className="font-mono text-[10px] opacity-80">({counts.Absent})</span>
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Full Name</th>
                <th className="py-3 px-4">Program & Section</th>
                <th className="py-3 px-4 text-center">Today's Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  // Find today's attendance status
                  const todayRec = records.find(
                    (r) => r.studentId === student.id && r.date === effective.dateStr
                  );
                  const status = todayRec ? todayRec.status : 'Absent';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-800/40 transition duration-150"
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                        {student.id}
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-3">
                          {/* Student Profile Photo / Avatar with interactive camera hover */}
                          <div 
                            onClick={() => setSelectedStudentForPhoto(student)}
                            className="relative group cursor-pointer shrink-0"
                            title={student.avatarUrl ? 'Click to change profile photo (Camera / Gallery)' : 'Click to take photo with camera or upload from gallery'}
                          >
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/70 group-hover:border-indigo-400 shadow-md transition"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-indigo-500/60 flex items-center justify-center font-bold text-xs text-indigo-300 transition">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Camera className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>

                          <div>
                            <span className="block leading-tight text-white">{student.name}</span>
                            {student.email ? (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">{student.email}</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 block">
                                {student.avatarUrl ? 'Photo on file' : 'No photo added'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                          {student.course} - {student.section}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : status === 'Late'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Profile Photo Button (Camera / Gallery) */}
                          <button
                            onClick={() => setSelectedStudentForPhoto(student)}
                            title={student.avatarUrl ? 'Update Profile Photo (Camera/Gallery)' : 'Add Profile Photo using Camera or Gallery'}
                            className={`p-1.5 rounded-lg transition flex items-center ${
                              student.avatarUrl
                                ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          {/* View QR Code Button */}
                          <button
                            onClick={() => onOpenQRModal(student)}
                            title="Generate & View QR Code Badge"
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(student)}
                            title="Edit Student Information"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setStudentToDelete(student)}
                            title="Delete Student"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/60 shadow-inner">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">No students found</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchQuery
                            ? `No records match "${searchQuery}". Check the student name or ID spelling.`
                            : `No students found matching the selected "${statusFilter}" filter.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold transition"
                      >
                        Clear search & filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal with Real-time Auto-Generated QR Code */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {editingStudent ? 'Edit Student Details' : 'Register New Student'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingStudent
                      ? 'Update enrolled student profile information.'
                      : 'Register student to automatically generate attendance QR code.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Form Fields */}
                <div className="md:col-span-7 space-y-3.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        Student ID Number *
                      </label>
                      {!editingStudent && (
                        <button
                          type="button"
                          onClick={() => setFormId(generateNextStudentId())}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium transition"
                          title="Generate next sequential student ID"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-Generate Next ID</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 20261671477"
                        disabled={!!editingStudent}
                        value={formId}
                        onChange={(e) => setFormId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                        required
                      />
                    </div>
                    {editingStudent ? (
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Student ID is permanent to protect QR code binding.
                      </span>
                    ) : (
                      <span className="text-[11px] text-indigo-400/90 mt-0.5 block font-mono">
                        ✓ QR code is generated instantly from this ID.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Student Full Name (LASTNAME, FIRSTNAME M.I.) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DELA CRUZ, JUAN A."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 uppercase font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Program / Degree</label>
                      <input
                        type="text"
                        value={formCourse}
                        onChange={(e) => setFormCourse(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Class Section</label>
                      <input
                        type="text"
                        value={formSection}
                        onChange={(e) => setFormSection(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="student@school.edu.ph"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Contact Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="09123456789"
                        value={formContact}
                        onChange={(e) => setFormContact(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Profile Photo Selector: Device Camera or Gallery */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Student Profile Photo (Camera / Gallery)
                    </label>
                    <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-950 border border-slate-700/80">
                      {formAvatarUrl ? (
                        <div className="relative group shrink-0">
                          <img
                            src={formAvatarUrl}
                            alt="Student avatar preview"
                            className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormAvatarUrl(undefined)}
                            className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[10px] shadow"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForPhoto({
                                id: formId || 'NEW',
                                name: formName || 'New Student',
                                course: formCourse,
                                section: formSection,
                                avatarUrl: formAvatarUrl,
                              });
                            }}
                            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{formAvatarUrl ? 'Change Photo' : 'Take Photo / Upload'}</span>
                          </button>

                          {formAvatarUrl && (
                            <button
                              type="button"
                              onClick={() => setFormAvatarUrl(undefined)}
                              className="px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs transition flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Capture with device camera or upload picture from gallery.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Auto-Generated QR Code Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-indigo-500/20 rounded-2xl text-center space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400">
                    <QrCode className="w-4 h-4" />
                    <span>Auto-Generated QR Code</span>
                  </div>

                  {/* QR Image Box */}
                  <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200">
                    {liveQrPreviewUrl ? (
                      <img
                        src={liveQrPreviewUrl}
                        alt={`QR Preview for ${formId}`}
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-400 text-xs p-2">
                        <QrCode className="w-8 h-8 text-slate-600 mb-1 animate-pulse" />
                        <span>Enter Student ID to generate QR</span>
                      </div>
                    )}
                  </div>

                  {/* Identity Preview with Avatar if present */}
                  <div className="space-y-1 flex flex-col items-center">
                    {formAvatarUrl && (
                      <img
                        src={formAvatarUrl}
                        alt="Avatar thumbnail"
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shadow mb-1"
                      />
                    )}
                    <span className="font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full inline-block">
                      ID: {formId || 'Pending'}
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase truncate max-w-[200px]">
                      {formName.trim() || 'STUDENT NAME'}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Ready to Bind Upon Register</span>
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed px-2">
                    When you register, this QR code is automatically generated, saved, and opened for immediate printing or scanning.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{editingStudent ? 'Save Changes' : 'Register Student & Generate QR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
            <div className="flex items-center space-x-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Student?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove{' '}
              <strong className="text-white">{studentToDelete.name}</strong> (ID:{' '}
              <span className="font-mono text-indigo-300">{studentToDelete.id}</span>) from the
              BSIT Set B class list?
            </p>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Photo Modal (Camera & Gallery Upload) */}
      {selectedStudentForPhoto && (
        <StudentPhotoModal
          student={selectedStudentForPhoto}
          isOpen={!!selectedStudentForPhoto}
          onClose={() => setSelectedStudentForPhoto(null)}
          onSavePhoto={handleSavePhoto}
        />
      )}
    </div>
  );
};
