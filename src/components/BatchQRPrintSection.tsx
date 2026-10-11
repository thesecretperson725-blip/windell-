import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  Search, 
  Download, 
  QrCode, 
  Sparkles,
  Upload,
  Share2
} from 'lucide-react';
import { Student, SystemSettings } from '../types/attendance';
import { getThemeConfig } from '../utils/themeUtils';

interface BatchQRPrintSectionProps {
  students: Student[];
  settings: SystemSettings;
}

interface StudentQRItem {
  student: Student;
  qrUrl: string;
}

type CardDesign = 'midnight' | 'emerald' | 'amber' | 'purple';

export const BatchQRPrintSection: React.FC<BatchQRPrintSectionProps> = ({
  students,
  settings,
}) => {
  const theme = getThemeConfig(settings.colorTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrItems, setQrItems] = useState<StudentQRItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'cards' | 'compact'>('cards');
  const [cardDesign, setCardDesign] = useState<CardDesign>('midnight');
  const [customBgImage, setCustomBgImage] = useState<string>('');
  const [customBatchLogo, setCustomBatchLogo] = useState<string>('');
  const batchBgInputRef = useRef<HTMLInputElement | null>(null);
  const batchLogoInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-generate QR codes for all students
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const generateAll = async () => {
      const results: StudentQRItem[] = [];
      for (const student of students) {
        try {
          const qrUrl = await QRCode.toDataURL(student.id, {
            width: 220,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          results.push({ student, qrUrl });
        } catch (err) {
          console.error(`Failed to generate QR for ${student.id}:`, err);
        }
      }
      if (isMounted) {
        setQrItems(results);
        setIsLoading(false);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [students]);

  const filteredItems = qrItems.filter(
    (item) =>
      item.student.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.student.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleShareBatchToMessenger = () => {
    const text = `🎓 *CLASS QR ATTENDANCE PASSES* 🎓\nSchool: ${settings.schoolName}\nCourse: ${settings.courseName} (${settings.sectionName})\nTotal Students: ${students.length}\nSystem Link: ${window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Copied class QR batch details and system link for Messenger GC! Opening Messenger...`);
        window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank');
      }).catch(() => {
        window.open(`https://m.me/`, '_blank');
      });
    } else {
      window.open(`https://m.me/`, '_blank');
    }
  };

  const handleExportBatchPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.schoolName || 'Goldenstate College', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${settings.courseName} - ${settings.sectionName} | Official QR Attendance Badges`, 105, 22, { align: 'center' });

    let startX = 15;
    let startY = 32;
    const cardWidth = 55;
    const cardHeight = 70;
    const marginX = 8;
    const marginY = 8;
    const cols = 3;

    filteredItems.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor((idx / cols) % 3);

      if (idx > 0 && idx % 9 === 0) {
        doc.addPage();
        startY = 20;
      }

      const currentX = startX + col * (cardWidth + marginX);
      const currentY = startY + row * (cardHeight + marginY);

      // Card Background & Design matching selected theme / custom wallpaper
      if (customBgImage) {
        try {
          doc.addImage(customBgImage, 'JPEG', currentX, currentY, cardWidth, cardHeight);
          // Dark overlay for contrast
          doc.setFillColor(15, 23, 42);
          doc.setGState(new (doc as any).GState({ opacity: 0.65 }));
          doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'F');
          doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
        } catch (e) {
          doc.setFillColor(15, 23, 42);
          doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD');
        }
      } else {
        if (cardDesign === 'emerald') {
          doc.setFillColor(6, 78, 59); // Emerald dark
        } else if (cardDesign === 'amber') {
          doc.setFillColor(120, 53, 15); // Amber dark
        } else if (cardDesign === 'purple') {
          doc.setFillColor(88, 28, 135); // Purple dark
        } else {
          doc.setFillColor(15, 23, 42); // Midnight slate
        }
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      }

      // Header logo in PDF if available
      if (customBatchLogo) {
        try {
          doc.addImage(customBatchLogo, 'PNG', currentX + cardWidth / 2 - 3, currentY + 2, 6, 6);
        } catch (e) {
          // fallback
        }
      }

      // Title & Semester
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(199, 210, 254);
      doc.text(settings.shortName ? `${settings.shortName} ATTENDANCE PASS` : 'BSIT SET B MS ATTENDANCE PASS', currentX + cardWidth / 2, currentY + 10.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(203, 213, 225);
      doc.text(settings.semester || '1st Semester, Academic Year 2026-2027', currentX + cardWidth / 2, currentY + 13.5, { align: 'center' });

      // QR Image (white background card box for scan readability)
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(currentX + 12.5, currentY + 15.5, 30, 30, 2, 2, 'F');
      if (item.qrUrl) {
        try {
          doc.addImage(item.qrUrl, 'PNG', currentX + 13.5, currentY + 16.5, 28, 28);
        } catch (e) {
          console.error(e);
        }
      }

      // Student Name & ID
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const studentNameLines = doc.splitTextToSize(item.student.name, cardWidth - 6);
      doc.text(studentNameLines[0] || item.student.name, currentX + cardWidth / 2, currentY + 51, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(129, 140, 248);
      doc.text(item.student.id, currentX + cardWidth / 2, currentY + 57, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`${item.student.course || 'BSIT'} • ${item.student.section || 'Set B'}`, currentX + cardWidth / 2, currentY + 62, { align: 'center' });

      // Thin divider line
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.2);
      doc.line(currentX + 6, currentY + 64, currentX + cardWidth - 6, currentY + 64);

      // Footer Validity
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`#${idx + 1} • VALID 2026–2027`, currentX + cardWidth / 2, currentY + 67.5, { align: 'center' });
    });

    doc.save(`${settings.shortName || 'BSIT'}_Batch_QR_ID_Badges_${filteredItems.length}.pdf`);
  };

  const handleDownloadCard = async (student: Student, elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: (element) => element.classList.contains('no-print'),
      });
      
      const fileName = `QR_Card_${student.id}_${student.name.replace(/\s+/g, '_')}.png`;

      // On mobile devices supporting navigator.share, offer direct sharing / save to device photo library
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title: `QR Attendance Pass - ${student.name}`,
                  text: `Official Attendance QR ID Card for ${student.name} (${student.id})`,
                });
                return;
              } catch (shareErr) {
                // If user cancels share or error occurs, fall through to direct download link
              }
            }
          }
        }, 'image/png');
      }

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download individual card:', err);
      try {
        const qrUrl = await QRCode.toDataURL(student.id, { width: 400, margin: 2 });
        const link = document.createElement('a');
        link.download = `QR_Code_${student.id}.png`;
        link.href = qrUrl;
        link.click();
      } catch (fallbackErr) {
        alert('Failed to download card image. Please try again.');
      }
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBatchLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBatchLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBatchDesignClasses = (design: CardDesign) => {
    switch (design) {
      case 'emerald':
        return 'bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 border-emerald-500/60 text-emerald-100';
      case 'amber':
        return 'bg-gradient-to-b from-slate-950 via-amber-950/80 to-slate-950 border-amber-500/60 text-amber-100';
      case 'purple':
        return 'bg-gradient-to-b from-slate-950 via-purple-950/80 to-slate-950 border-purple-500/60 text-purple-100';
      case 'midnight':
      default:
        return 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-indigo-500/60 text-indigo-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Screen Control Header (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.accentText}`}>
              <QrCode className="w-5 h-5" />
            </span>
            <span className={`text-xs font-bold ${theme.accentText} uppercase tracking-wider`}>
              Class Batch QR ID Badges & Gallery Designer
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Print & Export QR Cards ({students.length} Students)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Custom card design themes and wallpapers are automatically included in prints and PDF exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layout switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLayoutMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                layoutMode === 'cards'
                  ? `${theme.primaryButton} text-white shadow-sm`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ID Card Badges
            </button>
            <button
              onClick={() => setLayoutMode('compact')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                layoutMode === 'compact'
                  ? `${theme.primaryButton} text-white shadow-sm`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Compact Slips
            </button>
          </div>

          <button
            onClick={handleShareBatchToMessenger}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            title="Share class QR passes and link to Messenger GC"
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            <span>Messenger</span>
          </button>

          <button
            onClick={handleExportBatchPDF}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5"
            title="Export all QR cards with selected background themes and header logo to a PDF document"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export PDF with Header Logo & Design</span>
          </button>

          <button
            onClick={handlePrint}
            className={`px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} text-white text-xs font-bold rounded-xl shadow-lg ${theme.glow} transition flex items-center space-x-1.5`}
          >
            <Printer className="w-4 h-4" />
            <span>Print All Badges</span>
          </button>
        </div>
      </div>

      {/* Background & Design Customization Toolbar (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Batch Card Theme:</span>
          </span>
          <button
            onClick={() => setCardDesign('midnight')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              cardDesign === 'midnight'
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🌙 Midnight
          </button>
          <button
            onClick={() => setCardDesign('emerald')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              cardDesign === 'emerald'
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🌿 Emerald
          </button>
          <button
            onClick={() => setCardDesign('amber')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              cardDesign === 'amber'
                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 Amber
          </button>
          <button
            onClick={() => setCardDesign('purple')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              cardDesign === 'purple'
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            💜 Royal
          </button>

          {/* Gallery Wallpaper Input */}
          <input
            type="file"
            ref={batchBgInputRef}
            onChange={handleGalleryUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => batchBgInputRef.current?.click()}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>Gallery Wallpaper</span>
          </button>
          {customBgImage && (
            <button
              onClick={() => setCustomBgImage('')}
              className="text-[11px] text-rose-400 hover:underline ml-1"
            >
              Reset Wallpaper
            </button>
          )}

          {/* Header Logo Input */}
          <input
            type="file"
            ref={batchLogoInputRef}
            onChange={handleBatchLogoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => batchLogoInputRef.current?.click()}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1"
            title="Upload or change logo at top of card header"
          >
            <Upload className="w-3 h-3 text-indigo-400" />
            <span>{customBatchLogo ? 'Change Header Logo' : 'Add Header Logo'}</span>
          </button>
          {customBatchLogo && (
            <button
              onClick={() => setCustomBatchLogo('')}
              className="text-[11px] text-rose-400 hover:underline ml-1"
            >
              Remove Logo
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="p-12 text-center text-slate-400 no-print">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold">Generating QR code cards for BSIT Set B...</p>
        </div>
      )}

      {/* Printable Sheet Header (Visible only when printed) */}
      <div className="hidden print:block text-black text-center mb-4 pb-2 border-b border-black">
        <h2 className="text-base font-bold uppercase">{settings.schoolName}</h2>
        <h3 className="text-xs font-bold">{settings.courseName} - {settings.sectionName}</h3>
        <p className="text-[10px] text-gray-700">Official Student QR Attendance Badges &bull; Cut along dotted lines</p>
      </div>

      {/* Cards Grid */}
      {!isLoading && (
        <div
          className={
            layoutMode === 'cards'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 gap-4 print:gap-3'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 print:grid-cols-4 gap-3 print:gap-2'
          }
        >
          {filteredItems.map((item, idx) => (
            <div
              key={item.student.id}
              id={`batch-card-${item.student.id}`}
              className={`border-2 border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.25)] rounded-2xl p-4 print:shadow-none flex flex-col items-center text-center justify-between print-break-inside-avoid transition-all ${getBatchDesignClasses(
                cardDesign
              )} ${layoutMode === 'compact' ? 'space-y-1.5' : 'space-y-3'}`}
              style={{
                ...(customBgImage
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.90)), url(${customBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}),
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
              }}
            >
              {/* Top Section: Centered School Logo & Title */}
              <div className="w-full flex flex-col items-center space-y-0.5">
                <div className="w-8 h-8 bg-slate-900 rounded-full border-2 border-indigo-400/60 shadow-md flex items-center justify-center overflow-hidden mb-1">
                  {customBatchLogo ? (
                    <img src={customBatchLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[8px] font-black text-indigo-300">GSC</span>
                  )}
                </div>
                <div className="text-[8.5px] font-black uppercase tracking-wider text-indigo-200 print:text-indigo-200 truncate w-full px-1">
                  {settings.shortName ? `${settings.shortName} ATTENDANCE PASS` : 'BSIT SET B MS ATTENDANCE PASS'}
                </div>
                <div className="text-[7.5px] text-slate-300 print:text-slate-200 font-medium">
                  {settings.semester || '1st Semester, Academic Year 2026-2027'}
                </div>
              </div>

              {/* QR Code Container (White rounded rectangle) */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner">
                <img
                  src={item.qrUrl}
                  alt={`QR ${item.student.id}`}
                  className={layoutMode === 'compact' ? 'w-24 h-24' : 'w-32 h-32'}
                />
              </div>

              {/* Student Information */}
              <div className="w-full space-y-1">
                {item.student.avatarUrl && (
                  <img
                    src={item.student.avatarUrl}
                    alt={item.student.name}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-400 mx-auto mb-1 shadow-sm"
                  />
                )}
                <div className="text-[11px] font-bold text-white print:text-white leading-tight uppercase line-clamp-2">
                  {item.student.name}
                </div>
                <div className="font-mono text-xs font-black text-indigo-300 print:text-indigo-200 tracking-wide">
                  {item.student.id}
                </div>
                <div className="text-[9px] text-slate-300 print:text-slate-200 font-semibold">
                  {item.student.course || 'BSIT'} &bull; {item.student.section || 'Set B'}
                </div>
              </div>

              {/* Bottom Section: Thin Divider, Validity & Individual Download Button */}
              <div className="w-full pt-1.5 mt-1 border-t border-slate-800/80 flex flex-col space-y-1.5 items-center">
                <span className="text-[8px] text-slate-400 print:text-slate-300 font-mono uppercase tracking-widest">
                  #{idx + 1} &bull; VALID 2026–2027
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadCard(item.student, `batch-card-${item.student.id}`);
                  }}
                  className="w-full py-1.5 bg-indigo-600/25 hover:bg-indigo-600/45 text-indigo-200 border border-indigo-500/40 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 shadow-sm no-print"
                  title="Download this individual QR card as PNG"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Download Card</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
