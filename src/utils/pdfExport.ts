import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, AttendanceRecord, SystemSettings } from '../types/attendance';
import { getCurrentEffectiveDateTime, formatDateToWords } from './dateUtils';

export interface ClassListPdfOptions {
  students: Student[];
  settings: SystemSettings;
  customTitle?: string;
}

export interface AttendanceLogPdfOptions {
  records: AttendanceRecord[];
  selectedDate: string;
  settings: SystemSettings;
  customTitle?: string;
}

export interface StudentDirectoryPdfOptions {
  students: Student[];
  records?: AttendanceRecord[];
  settings: SystemSettings;
  customTitle?: string;
}

// Helper to draw an authentic academic vector seal at the upper left if no custom bitmap is provided
function drawVectorSeal(doc: jsPDF, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  // Outer gold rim
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.6);
  doc.setFillColor(254, 243, 199); // amber-100
  doc.circle(cx, cy, r, 'FD');

  // Inner navy circle
  doc.setDrawColor(30, 58, 138); // blue-900
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r - 1.2, 'FD');

  // Academic Monogram & Emblem
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text('GC', cx, cy + 0.8, { align: 'center' });

  // Academic Stars
  doc.setFontSize(4.5);
  doc.setTextColor(217, 119, 6);
  doc.text('EST. 2026', cx, cy + 4.2, { align: 'center' });
  doc.text('★ ★ ★', cx, cy - 2.8, { align: 'center' });
}

export function exportClassListPDF({ students, settings, customTitle }: ClassListPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const effective = getCurrentEffectiveDateTime(settings);
  const schoolName = settings.schoolName || 'Goldenstate College of Koronadal City';
  const schoolLocation = settings.schoolLocation || 'Koronadal City, South Cotabato';
  const docTitle = customTitle || settings.classListTitle || 'BSIT1167MS B Class List';
  const semester = settings.semester || '1st Semester';
  const academicYear = settings.academicYear || 'Academic Year 2026-2027';
  const degreeProgram = settings.degreeProgram || settings.courseName || 'Bachelor of Science in Information Technology (BSIT)';
  const campusBranch = settings.campusBranch || 'Koronadal City Campus';
  const instructor = settings.instructorName || 'Prof. J. Dela Cruz, MIT';
  const dateGenerated = `${effective.fullDisplayDate} at ${effective.timeStr12}`;

  // Font family resolution
  const font = settings.documentFontFamily === 'serif' ? 'times' : settings.documentFontFamily === 'mono' ? 'courier' : 'helvetica';

  // Border color resolution
  let tableLineColor: [number, number, number] = [209, 213, 219]; // thin gray-300
  if (settings.documentBorderColor === 'gray-200') {
    tableLineColor = [229, 231, 235];
  } else if (settings.documentBorderColor === 'gray-400') {
    tableLineColor = [156, 163, 175];
  }

  // Row density resolution
  let cellPadding = 2.0;
  if (settings.documentDensity === 'compact') cellPadding = 1.4;
  else if (settings.documentDensity === 'spacious') cellPadding = 2.8;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header: School Logo at Upper Left
  const logoX = margin;
  const logoY = 12;
  const logoSize = 13.5;
  const textX = margin + logoSize + 3.5;

  if (settings.schoolLogoUrl && settings.schoolLogoUrl.startsWith('data:image')) {
    try {
      const format = settings.schoolLogoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.schoolLogoUrl, format, logoX, logoY, logoSize, logoSize);
    } catch {
      drawVectorSeal(doc, logoX, logoY, logoSize);
    }
  } else {
    drawVectorSeal(doc, logoX, logoY, logoSize);
  }

  // Header: School Name & Location beside the logo (No dividing line below it)
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, textX, 17);

  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolLocation || 'Koronadal City', textX, 22.5);

  // Centered Document Block matching exact image
  const centerBlockY = 32;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(docTitle, pageWidth / 2, centerBlockY, { align: 'center' });

  doc.setFont(font, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const semesterAyLine = `${semester || '1st Semester'}, ${academicYear || '2026-2027 Academic Year'}`;
  doc.text(semesterAyLine, pageWidth / 2, centerBlockY + 5, { align: 'center' });

  const programBranchLine = `${degreeProgram || 'Bachelor of Science in Information Technology'}, ${campusBranch || 'Koronadal Branch'}`;
  doc.text(programBranchLine, pageWidth / 2, centerBlockY + 9.5, { align: 'center' });

  doc.text(effective.asOfDateStr, pageWidth / 2, centerBlockY + 14, { align: 'center' });

  // 3-Column Student Table: No. (with dot), Student ID, Student Name
  const tableData = students.map((s, idx) => [
    `${idx + 1}.`,
    s.id,
    s.name.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: centerBlockY + 18,
    body: tableData,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    styles: {
      font: font,
      fontSize: 8.5,
      textColor: [0, 0, 0], // Pure black text
      cellPadding: cellPadding,
      lineWidth: 0.2,
      lineColor: [156, 163, 175], // Thin gray border
      fillColor: [255, 255, 255], // Pure white background
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // Pure white background throughout
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'normal' },
      1: { cellWidth: 40, halign: 'left', fontStyle: 'normal' },
      2: { halign: 'left', fontStyle: 'normal' },
    },
    didDrawPage: (data) => {
      // Minimalist Running Page Number at bottom center
      const totalPages = doc.getNumberOfPages();
      doc.setFont(font, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },
  });

  const cleanFileName = (docTitle || 'BSIT1167MS_B_Class_List').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFileName}.pdf`);
}

export interface AttendanceReportPdfOptions {
  title: string;
  reportType: 'daily' | 'summary' | 'student_breakdown';
  settings: SystemSettings;
  headers: string[];
  rows: (string | number)[][];
  totalStudents: number;
}

export function exportAttendanceReportPDF({
  title,
  settings,
  headers,
  rows,
  totalStudents,
}: AttendanceReportPdfOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const effective = getCurrentEffectiveDateTime(settings);
  const schoolName = settings.schoolName || 'Goldenstate College of Koronadal City';
  const schoolLocation = settings.schoolLocation || 'Koronadal City, South Cotabato';
  const semester = settings.semester || '1st Semester';
  const academicYear = settings.academicYear || 'Academic Year 2026-2027';
  const degreeProgram = settings.degreeProgram || settings.courseName || 'Bachelor of Science in Information Technology (BSIT)';
  const campusBranch = settings.campusBranch || 'Koronadal City Campus';
  const dateGenerated = `${effective.fullDisplayDate} at ${effective.timeStr12}`;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 24, 33);
  doc.text(schoolName.toUpperCase(), margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`${schoolLocation}  |  Office of the College Registrar  |  Department of Information Technology`, margin, 20);

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(margin, 23, pageWidth - margin, 23);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(17, 24, 39);
  doc.text(title.toUpperCase(), pageWidth / 2, 29, { align: 'center' });

  // Academic details line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  const metaText = `Semester: ${semester}  |  AY: ${academicYear}  |  Program: ${degreeProgram}  |  Branch: ${campusBranch}  |  Generated: ${dateGenerated}  |  Total Size: ${totalStudents} Students`;
  doc.text(metaText, pageWidth / 2, 34, { align: 'center' });

  autoTable(doc, {
    startY: 37,
    head: [headers],
    body: rows.map(r => r.map(c => String(c))),
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 1.8,
      lineWidth: 0.15,
      lineColor: [209, 213, 219],
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [156, 163, 175],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didDrawPage: (data) => {
      const totalPages = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      const footerText = `${schoolName}  |  ${title}  |  Page ${data.pageNumber} of ${totalPages}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },
  });

  const cleanFileName = title.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFileName}.pdf`);
}

export function exportAttendanceLogPDF({
  records,
  selectedDate,
  settings,
  customTitle,
}: AttendanceLogPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const effective = getCurrentEffectiveDateTime(settings);
  const schoolName = settings.schoolName || 'Goldenstate College of Koronadal City';
  const schoolLocation = settings.schoolLocation || 'Koronadal City';
  const docTitle = customTitle || `${settings.classListTitle || 'BSIT1167MS B'} Attendance Log`;
  const semester = settings.semester || '1st Semester';
  const academicYear = settings.academicYear || '2026-2027 Academic Year';
  const degreeProgram = settings.degreeProgram || 'Bachelor of Science in Information Technology';
  const campusBranch = settings.campusBranch || 'Koronadal Branch';

  const font = settings.documentFontFamily === 'serif' ? 'times' : settings.documentFontFamily === 'mono' ? 'courier' : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header: School Logo at Upper Left
  const logoX = margin;
  const logoY = 12;
  const logoSize = 13.5;
  const textX = margin + logoSize + 3.5;

  if (settings.schoolLogoUrl && settings.schoolLogoUrl.startsWith('data:image')) {
    try {
      const format = settings.schoolLogoUrl.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.schoolLogoUrl, format, logoX, logoY, logoSize, logoSize);
    } catch {
      drawVectorSeal(doc, logoX, logoY, logoSize);
    }
  } else {
    drawVectorSeal(doc, logoX, logoY, logoSize);
  }

  // Header: School Name & Location beside logo
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, textX, 17);

  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolLocation, textX, 22.5);

  // Centered Document Information Block
  const centerBlockY = 32;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(docTitle, pageWidth / 2, centerBlockY, { align: 'center' });

  doc.setFont(font, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`${semester}, ${academicYear}`, pageWidth / 2, centerBlockY + 5, { align: 'center' });
  doc.text(`${degreeProgram}, ${campusBranch}`, pageWidth / 2, centerBlockY + 9.5, { align: 'center' });
  doc.text(`Date of Attendance: ${formatDateToWords(selectedDate)} (${effective.asOfDateStr})`, pageWidth / 2, centerBlockY + 14, { align: 'center' });

  // 7-Column Table: No., Student ID, Student Name, Time In, Time Out, Status, Remarks
  const tableData = records.map((r, idx) => [
    `${idx + 1}.`,
    r.studentId,
    r.studentName.toUpperCase(),
    r.timeIn || '—',
    r.timeOut || '—',
    r.status,
    r.remarks || '—',
  ]);

  autoTable(doc, {
    startY: centerBlockY + 18,
    head: [['No.', 'Student ID', 'Student Name', 'Time In', 'Time Out', 'Status', 'Remarks']],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    styles: {
      font: font,
      fontSize: 7.5,
      textColor: [0, 0, 0],
      cellPadding: 1.8,
      lineWidth: 0.2,
      lineColor: [156, 163, 175],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [156, 163, 175],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'normal' },
      1: { cellWidth: 28, halign: 'left', fontStyle: 'normal' },
      2: { cellWidth: 48, halign: 'left', fontStyle: 'normal' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'normal' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'normal' },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      6: { halign: 'left', fontStyle: 'normal' },
    },
    didDrawPage: (data) => {
      const totalPages = doc.getNumberOfPages();
      doc.setFont(font, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },
  });

  const cleanFileName = `Attendance_Log_${selectedDate}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFileName}.pdf`);
}

export function exportStudentDirectoryPDF({
  students,
  settings,
  customTitle,
}: StudentDirectoryPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const effective = getCurrentEffectiveDateTime(settings);
  const schoolName = settings.schoolName || 'Goldenstate College of Koronadal City';
  const schoolLocation = settings.schoolLocation || 'Koronadal City';
  const docTitle = customTitle || `${settings.classListTitle || 'BSIT1167MS B'} Student Registration & Directory`;
  const semester = settings.semester || '1st Semester';
  const academicYear = settings.academicYear || '2026-2027 Academic Year';
  const degreeProgram = settings.degreeProgram || 'Bachelor of Science in Information Technology';
  const campusBranch = settings.campusBranch || 'Koronadal Branch';

  const font = settings.documentFontFamily === 'serif' ? 'times' : settings.documentFontFamily === 'mono' ? 'courier' : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header: School Logo at Upper Left
  const logoX = margin;
  const logoY = 12;
  const logoSize = 13.5;
  const textX = margin + logoSize + 3.5;

  if (settings.schoolLogoUrl && settings.schoolLogoUrl.startsWith('data:image')) {
    try {
      const format = settings.schoolLogoUrl.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.schoolLogoUrl, format, logoX, logoY, logoSize, logoSize);
    } catch {
      drawVectorSeal(doc, logoX, logoY, logoSize);
    }
  } else {
    drawVectorSeal(doc, logoX, logoY, logoSize);
  }

  // Header: School Name & Location beside logo
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, textX, 17);

  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolLocation, textX, 22.5);

  // Centered Document Information Block
  const centerBlockY = 32;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(docTitle, pageWidth / 2, centerBlockY, { align: 'center' });

  doc.setFont(font, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`${semester}, ${academicYear}`, pageWidth / 2, centerBlockY + 5, { align: 'center' });
  doc.text(`${degreeProgram}, ${campusBranch}`, pageWidth / 2, centerBlockY + 9.5, { align: 'center' });
  doc.text(`Official Directory (${students.length} Registered Students) • ${effective.asOfDateStr}`, pageWidth / 2, centerBlockY + 14, { align: 'center' });

  // 6-Column Table: No., Student ID, Student Name, Program & Section, Email, Contact
  const tableData = students.map((s, idx) => [
    `${idx + 1}.`,
    s.id,
    s.name.toUpperCase(),
    `${s.course} ${s.section}`,
    s.email || '—',
    s.contactNumber || '—',
  ]);

  autoTable(doc, {
    startY: centerBlockY + 18,
    head: [['No.', 'Student ID', 'Student Name', 'Program & Section', 'Email Address', 'Contact No.']],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    styles: {
      font: font,
      fontSize: 7.5,
      textColor: [0, 0, 0],
      cellPadding: 1.8,
      lineWidth: 0.2,
      lineColor: [156, 163, 175],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [156, 163, 175],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'normal' },
      1: { cellWidth: 28, halign: 'left', fontStyle: 'normal' },
      2: { cellWidth: 54, halign: 'left', fontStyle: 'normal' },
      3: { cellWidth: 28, halign: 'center', fontStyle: 'normal' },
      4: { cellWidth: 38, halign: 'left', fontStyle: 'normal' },
      5: { halign: 'center', fontStyle: 'normal' },
    },
    didDrawPage: (data) => {
      const totalPages = doc.getNumberOfPages();
      doc.setFont(font, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },
  });

  const cleanFileName = `Student_Registration_Directory_${students.length}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFileName}.pdf`);
}
