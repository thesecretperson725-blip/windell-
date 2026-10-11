import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  GraduationCap, 
  FileText,
  Building,
  MapPin,
  Type,
  Calendar,
  Layers
} from 'lucide-react';
import { Student, SystemSettings } from '../types/attendance';
import { getCurrentEffectiveDateTime } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';
import { exportClassListPDF } from '../utils/pdfExport';

interface ClassListDocumentProps {
  students: Student[];
  settings: SystemSettings;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

// Authentic High-Resolution Vector Seal for Goldenstate College of Koronadal City
export const GOLDENSTATE_COLLEGE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23fbbf24"/>
      <stop offset="50%" stop-color="%23d97706"/>
      <stop offset="100%" stop-color="%23b45309"/>
    </linearGradient>
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231e3a8a"/>
      <stop offset="100%" stop-color="%230f172a"/>
    </linearGradient>
  </defs>
  <!-- Outer Gold Rim -->
  <circle cx="80" cy="80" r="76" fill="%23ffffff" stroke="url(%23goldGrad)" stroke-width="5"/>
  <!-- Navy Blue Ring -->
  <circle cx="80" cy="80" r="70" fill="none" stroke="url(%23navyGrad)" stroke-width="12"/>
  <!-- Inner Gold Beaded Rim -->
  <circle cx="80" cy="80" r="63" fill="%23ffffff" stroke="url(%23goldGrad)" stroke-width="2"/>
  
  <!-- Outer Ring Text (Circular Paths) -->
  <path id="topArc" d="M 22 80 A 58 58 0 0 1 138 80" fill="none"/>
  <text fill="%23ffffff" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="900" letter-spacing="1.2">
    <textPath href="%23topArc" startOffset="50%" text-anchor="middle">
      GOLDENSTATE COLLEGE
    </textPath>
  </text>
  
  <path id="bottomArc" d="M 138 80 A 58 58 0 0 1 22 80" fill="none"/>
  <text fill="%23ffffff" font-family="Arial, Helvetica, sans-serif" font-size="7.5" font-weight="bold" letter-spacing="1">
    <textPath href="%23bottomArc" startOffset="50%" text-anchor="middle">
      KORONADAL CITY
    </textPath>
  </text>

  <!-- Laurel Leaves in Center background -->
  <path d="M 46 80 C 44 95, 56 112, 80 116 C 104 112, 116 95, 114 80" fill="none" stroke="url(%23goldGrad)" stroke-width="2.5" stroke-linecap="round"/>
  
  <!-- Academic Shield in Center -->
  <path d="M 60 52 L 100 52 C 100 52 102 78 80 94 C 58 78 60 52 60 52 Z" fill="%23f8fafc" stroke="url(%23navyGrad)" stroke-width="2"/>
  
  <!-- IT Gear Wheel (representing BSIT & Technology) -->
  <circle cx="80" cy="66" r="10" fill="none" stroke="%23d97706" stroke-width="2" stroke-dasharray="3,2"/>
  <circle cx="80" cy="66" r="6" fill="%231e3a8a"/>

  <!-- Academic Torch of Knowledge -->
  <path d="M 78 78 L 82 78 L 81 88 L 79 88 Z" fill="%23b45309"/>
  <!-- Golden Flame -->
  <path d="M 80 57 C 82 60, 84 62, 82 64 C 80 66, 78 64, 80 57 Z" fill="%23ef4444"/>
  <path d="M 80 59 C 81 61, 82 62, 81 63 C 80 64, 79 63, 80 59 Z" fill="%23fbbf24"/>

  <!-- Open Academic Book Base -->
  <path d="M 66 76 Q 80 72 80 77 Q 80 72 94 76 L 94 82 Q 80 78 80 83 Q 80 78 66 82 Z" fill="%23ffffff" stroke="%231e3a8a" stroke-width="1.5"/>

  <!-- Golden Stars -->
  <polygon points="80,98 81.5,102 85,102 82,104 83.5,108 80,105.5 76.5,108 78,104 75,102 78.5,102" fill="url(%23goldGrad)"/>
</svg>`;

export const ClassListDocument: React.FC<ClassListDocumentProps> = ({
  students,
  settings,
  onUpdateSettings,
}) => {
  const theme = getThemeConfig(settings.colorTheme);
  const effective = getCurrentEffectiveDateTime(settings);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Customization Form State initialized with defaults
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    schoolName: settings.schoolName || 'Goldenstate College of Koronadal City',
    schoolLocation: settings.schoolLocation || 'Koronadal City, South Cotabato',
    classListTitle: settings.classListTitle || 'BSIT1167MS B Class List',
    semester: settings.semester || '1st Semester',
    academicYear: settings.academicYear || 'Academic Year 2026-2027',
    degreeProgram: settings.degreeProgram || settings.courseName || 'Bachelor of Science in Information Technology (BSIT)',
    campusBranch: settings.campusBranch || 'Koronadal City Campus',
    documentFontFamily: settings.documentFontFamily || 'sans',
    documentTitleTracking: settings.documentTitleTracking || 'wide',
    documentBorderColor: settings.documentBorderColor || 'gray-300',
    documentDensity: settings.documentDensity || 'normal',
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Logo Upload with Canvas Compression
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 800; // Optimal size for crisp high-res logo
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png');
          setFormData((prev) => ({
            ...prev,
            schoolLogoUrl: compressedDataUrl,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            schoolLogoUrl: src,
          }));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings(formData);
    }
    setIsCustomizeModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export CSV matching exact academic document format and 3-column table
  const handleExportCSV = () => {
    const schoolTitle = settings.schoolName || 'Goldenstate College of Koronadal City';
    const schoolLoc = settings.schoolLocation || 'Koronadal City, South Cotabato';
    const docTitle = settings.classListTitle || 'BSIT1167MS B Class List';
    const semesterInfo = settings.semester || '1st Semester';
    const ayInfo = settings.academicYear || 'Academic Year 2026-2027';
    const programInfo = settings.degreeProgram || settings.courseName || 'Bachelor of Science in Information Technology (BSIT)';
    const branchInfo = settings.campusBranch || 'Koronadal City Campus';
    const dateGenerated = `${effective.fullDisplayDate} at ${effective.timeStr12}`;

    const metadataLines = [
      `"${schoolTitle}"`,
      `"${schoolLoc}"`,
      `"${docTitle}"`,
      `"Semester: ${semesterInfo}"`,
      `"Academic Year: ${ayInfo}"`,
      `"Degree / Program: ${programInfo}"`,
      `"Campus / Branch: ${branchInfo}"`,
      `"Date/Time Generated: ${dateGenerated}"`,
      `"Total Enrolled: ${students.length} Students"`,
      '', // Blank line before table
      'No.,Student ID,Student Name',
    ];

    const studentRows = students.map((s, idx) => `${idx + 1},"${s.id}","${s.name}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [...metadataLines, ...studentRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanFileName = (docTitle || 'BSIT1167MS_B_Class_List').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${cleanFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    exportClassListPDF({
      students,
      settings,
      customTitle: settings.classListTitle || 'BSIT1167MS B Class List',
    });
  };

  const handleCopyTable = () => {
    const textData = [
      'No.\tStudent ID\tStudent Name',
      ...students.map((s, idx) => `${idx + 1}\t${s.id}\t${s.name}`),
    ].join('\n');

    navigator.clipboard.writeText(textData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Font family resolution for academic document
  const getDocumentFontClass = () => {
    switch (settings.documentFontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  // Title tracking resolution
  const getTitleTrackingClass = () => {
    switch (settings.documentTitleTracking) {
      case 'widest':
        return 'tracking-widest';
      case 'normal':
        return 'tracking-normal';
      default:
        return 'tracking-wide';
    }
  };

  // Density padding resolution for table rows
  const getCellPaddingClass = () => {
    switch (settings.documentDensity) {
      case 'compact':
        return 'py-1 px-3 text-xs';
      case 'spacious':
        return 'py-2.5 px-4 text-sm';
      default:
        return 'py-1.5 px-3.5 text-xs sm:text-sm';
    }
  };

  // Border color resolution
  const getBorderColorClass = () => {
    switch (settings.documentBorderColor) {
      case 'gray-200':
        return 'border-gray-200';
      case 'gray-400':
        return 'border-gray-400';
      default:
        return 'border-gray-300';
    }
  };

  const borderClass = getBorderColorClass();
  const activeLogo = settings.schoolLogoUrl || GOLDENSTATE_COLLEGE_LOGO_SVG;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className={`text-xs font-bold ${theme.accentText} uppercase tracking-wider`}>
              Official Class Roster Document
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
              Goldenstate College of Koronadal City
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {settings.classListTitle || 'BSIT1167MS B Class List'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal 3-column academic document with Goldenstate College seal, official metadata, and thin gray borders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Customizer Trigger */}
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...settings,
                schoolName: settings.schoolName || 'Goldenstate College of Koronadal City',
                schoolLocation: settings.schoolLocation || 'Koronadal City, South Cotabato',
                classListTitle: settings.classListTitle || 'BSIT1167MS B Class List',
                semester: settings.semester || '1st Semester',
                academicYear: settings.academicYear || 'Academic Year 2026-2027',
                degreeProgram: settings.degreeProgram || settings.courseName || 'Bachelor of Science in Information Technology (BSIT)',
                campusBranch: settings.campusBranch || 'Koronadal City Campus',
                documentFontFamily: settings.documentFontFamily || 'sans',
                documentTitleTracking: settings.documentTitleTracking || 'wide',
                documentBorderColor: settings.documentBorderColor || 'gray-300',
                documentDensity: settings.documentDensity || 'normal',
              });
              setIsCustomizeModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
            title="Change or replace logo, school name, location, and text design"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Change Logo & Design</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTable}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
            title="Copy 3-column table data to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Table</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
            title="Export official class list document to CSV file"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm hover:border-rose-500/50"
            title="Export official class list document to PDF file"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} text-white text-xs font-bold rounded-xl shadow-lg ${theme.glow} transition flex items-center space-x-1.5`}
            title="Print report or save to PDF file"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save to PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE FORMAL COLLEGE CLASS-LIST DOCUMENT (White background, official style) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 p-3 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto no-print">
        <div 
          id="official-class-list-document"
          className={`bg-white text-black p-6 sm:p-12 max-w-4xl mx-auto rounded-lg shadow-2xl border border-gray-200 ${getDocumentFontClass()} print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full`}
          style={{ minHeight: '1100px' }}
        >
          {/* Header Block: Top-left Goldenstate College of Koronadal City logo, followed by school name and location */}
          <div className="flex items-center gap-3.5 mb-6">
            {/* Logo at upper left */}
            <div className="shrink-0">
              <img
                src={activeLogo}
                alt="Goldenstate College of Koronadal City"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            </div>

            {/* School Name and Location beside logo */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-black leading-tight">
                {settings.schoolName || 'Goldenstate College of Koronadal City'}
              </h2>
              <p className="text-xs sm:text-sm text-black font-normal mt-0.5">
                {settings.schoolLocation || 'Koronadal City'}
              </p>
            </div>
          </div>

          {/* Centered Document Information Block: Title, Semester & AY, Program & Branch, As of date */}
          <div className="text-center my-6 space-y-1">
            <h1 className={`text-base sm:text-lg font-bold text-black ${getTitleTrackingClass()}`}>
              {settings.classListTitle || 'BSIT1167MS B Class List'}
            </h1>
            <p className="text-xs sm:text-sm text-black font-normal">
              {settings.semester || '1st Semester'}, {settings.academicYear || '2026-2027 Academic Year'}
            </p>
            <p className="text-xs sm:text-sm text-black font-normal">
              {settings.degreeProgram || 'Bachelor of Science in Information Technology'}, {settings.campusBranch || 'Koronadal Branch'}
            </p>
            <p className="text-xs sm:text-sm text-black font-normal">
              {effective.asOfDateStr}
            </p>
          </div>

          {/* Student List: Main section three-column table: No., Student ID, Student Name */}
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse border ${borderClass} bg-white text-black text-xs sm:text-sm`}>
              <tbody>
                {students.map((student, index) => {
                  const seqNo = `${index + 1}.`;
                  return (
                    <tr 
                      key={student.id} 
                      className={`border-b ${borderClass} bg-white`}
                    >
                      <td className={`border ${borderClass} ${getCellPaddingClass()} w-14 text-center font-normal text-black`}>
                        {seqNo}
                      </td>
                      <td className={`border ${borderClass} ${getCellPaddingClass()} w-44 sm:w-52 text-left font-normal text-black`}>
                        {student.id}
                      </td>
                      <td className={`border ${borderClass} ${getCellPaddingClass()} text-left font-normal text-black uppercase`}>
                        {student.name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY ROOT CONTAINER (Used exclusively during window.print())        */}
      {/* ========================================================================= */}
      <div className="hidden print:block bg-white text-black p-0 m-0 w-full">
        <div className={`bg-white text-black p-0 w-full ${getDocumentFontClass()}`}>
          {/* Header Block: Top-left logo, school name and location */}
          <div className="flex items-center gap-3 mb-5">
            <div className="shrink-0">
              <img
                src={activeLogo}
                alt="Goldenstate College Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div>
              <h2 className="text-sm font-bold text-black leading-tight">
                {settings.schoolName || 'Goldenstate College of Koronadal City'}
              </h2>
              <p className="text-xs text-black font-normal mt-0.5">
                {settings.schoolLocation || 'Koronadal City'}
              </p>
            </div>
          </div>

          {/* Centered Document Block matching exact image */}
          <div className="text-center my-5 space-y-0.5">
            <h1 className={`text-sm font-bold text-black ${getTitleTrackingClass()}`}>
              {settings.classListTitle || 'BSIT1167MS B Class List'}
            </h1>
            <p className="text-[11px] text-black font-normal">
              {settings.semester || '1st Semester'}, {settings.academicYear || '2026-2027 Academic Year'}
            </p>
            <p className="text-[11px] text-black font-normal">
              {settings.degreeProgram || 'Bachelor of Science in Information Technology'}, {settings.campusBranch || 'Koronadal Branch'}
            </p>
            <p className="text-[11px] text-black font-normal">
              {effective.asOfDateStr}
            </p>
          </div>

          {/* Three-Column Student Table */}
          <table className={`w-full border-collapse border ${borderClass} bg-white text-black text-[11px]`}>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className={`border-b ${borderClass} bg-white`}>
                  <td className={`border ${borderClass} py-0.5 px-2 w-12 text-center font-normal text-black`}>
                    {index + 1}.
                  </td>
                  <td className={`border ${borderClass} py-0.5 px-3 w-40 text-left font-normal text-black`}>
                    {student.id}
                  </td>
                  <td className={`border ${borderClass} py-0.5 px-3 text-left font-normal text-black uppercase`}>
                    {student.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN CUSTOMIZATION MODAL: Change or Replace Logo & Text Design           */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl text-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Class-List Document & Logo Design</h3>
                  <p className="text-xs text-slate-400">Change or replace the school logo, text design, and academic headers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveDesign} className="p-6 space-y-5 text-xs">
              {/* Section 1: School Logo Customization */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Goldenstate College Logo (Upper Left)</span>
                  </label>
                  {formData.schoolLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, schoolLogoUrl: '' }))}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset to Goldenstate College Seal</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {/* Current Logo Preview */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-700 p-2 flex items-center justify-center shrink-0 shadow">
                    <img
                      src={formData.schoolLogoUrl || GOLDENSTATE_COLLEGE_LOGO_SVG}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Upload and Options */}
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom School Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, schoolLogoUrl: '' }))}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
                      >
                        Use Goldenstate Official Seal
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      PNG, JPG, SVG, or WEBP. Uploaded logos scale automatically and stay crisp on print.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: School Name & Location (Beside Logo) */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span>School Name & Location (Beside Logo)</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      School / College Name
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, schoolName: e.target.value }))}
                      placeholder="e.g. Goldenstate College of Koronadal City"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      School Location (Beside Logo)
                    </label>
                    <input
                      type="text"
                      value={formData.schoolLocation || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, schoolLocation: e.target.value }))}
                      placeholder="e.g. Koronadal City, South Cotabato"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Document Title & Academic Information */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Document Title & Academic Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Centered Document Title
                    </label>
                    <input
                      type="text"
                      value={formData.classListTitle || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, classListTitle: e.target.value }))}
                      placeholder="e.g. BSIT1167MS B Class List"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Degree / Program
                    </label>
                    <input
                      type="text"
                      value={formData.degreeProgram || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, degreeProgram: e.target.value }))}
                      placeholder="e.g. Bachelor of Science in Information Technology (BSIT)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={formData.semester || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                      placeholder="e.g. 1st Semester"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="e.g. Academic Year 2026-2027"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-semibold block mb-1">
                      Campus / Branch
                    </label>
                    <input
                      type="text"
                      value={formData.campusBranch || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, campusBranch: e.target.value }))}
                      placeholder="e.g. Koronadal City Campus"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Typography & Text Design */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Type className="w-4 h-4 text-purple-400" />
                  <span>Typography & Text Design</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Font Family */}
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Font Family
                    </label>
                    <select
                      value={formData.documentFontFamily || 'sans'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, documentFontFamily: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="sans">Formal Sans-Serif (Standard)</option>
                      <option value="serif">Classic Academic Serif (Times)</option>
                      <option value="mono">Technical Monospace</option>
                    </select>
                  </div>

                  {/* Title Letter-Spacing / Tracking */}
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Title Tracking
                    </label>
                    <select
                      value={formData.documentTitleTracking || 'wide'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, documentTitleTracking: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide (Academic)</option>
                      <option value="widest">Extra Wide</option>
                    </select>
                  </div>

                  {/* Row Spacing Density */}
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Row Density
                    </label>
                    <select
                      value={formData.documentDensity || 'normal'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, documentDensity: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="compact">Compact (More rows per page)</option>
                      <option value="normal">Academic Standard</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Save & Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
