import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { X, Download, Printer, QrCode, Sparkles, Image as ImageIcon, Upload, CheckCircle, Share2, IdCard } from 'lucide-react';
import { Student, SystemSettings } from '../types/attendance';

interface StudentQRModalProps {
  student: Student | null;
  settings: SystemSettings;
  onClose: () => void;
  isNewlyRegistered?: boolean;
}

type CardDesign = 'midnight' | 'emerald' | 'amber' | 'purple' | 'cyan';
type CardType = 'badge' | 'id-card' | 'mini';

export const StudentQRModal: React.FC<StudentQRModalProps> = ({
  student,
  settings,
  onClose,
  isNewlyRegistered = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [cardDesign, setCardDesign] = useState<CardDesign>('midnight');
  const [cardType, setCardType] = useState<CardType>('badge');
  const [customBgImage, setCustomBgImage] = useState<string>('');
  const [customLogo, setCustomLogo] = useState<string>('');
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (student) {
      QRCode.toDataURL(student.id, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [student]);

  if (!student) return null;

  const handleDownloadPNG = async () => {
    if (!badgeRef.current) return;
    try {
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_${cardType.toUpperCase()}_ID_${student.id}_${student.name.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Failed to export card image:', err);
      if (qrDataUrl) {
        const link = document.createElement('a');
        link.download = `QR_Card_${student.id}.png`;
        link.href = qrDataUrl;
        link.click();
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareToMessenger = () => {
    const text = `🎓 *OFFICIAL ATTENDANCE QR PASS* 🎓\nSchool: ${settings.schoolName}\nCourse: ${settings.courseName}\nName: ${student.name}\n🆔 ID Number: ${student.id}\nSection: ${student.section}\nCard Format: ${cardType.toUpperCase()}\nSystem Link: ${window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Copied student details, ID (${student.id}), and QR card info for Messenger GC! Opening Messenger...`);
        window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank');
      }).catch(() => {
        window.open(`https://m.me/`, '_blank');
      });
    } else {
      window.open(`https://m.me/`, '_blank');
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDesignClasses = (design: CardDesign) => {
    switch (design) {
      case 'emerald':
        return 'bg-gradient-to-b from-slate-950 via-emerald-950/60 to-slate-950 border-emerald-500/60 shadow-emerald-500/10';
      case 'amber':
        return 'bg-gradient-to-b from-slate-950 via-amber-950/60 to-slate-950 border-amber-500/60 shadow-amber-500/10';
      case 'purple':
        return 'bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950 border-purple-500/60 shadow-purple-500/10';
      case 'cyan':
        return 'bg-gradient-to-b from-slate-950 via-cyan-950/60 to-slate-950 border-cyan-500/60 shadow-cyan-500/10';
      case 'midnight':
      default:
        return 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-indigo-500/60 shadow-indigo-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 text-slate-100 flex flex-col no-print my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Student QR Card & ID Designer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Newly Registered Alert */}
        {isNewlyRegistered && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5 animate-pulse">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <span className="font-bold text-emerald-200">Student Registered Successfully!</span>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                QR card for <strong className="text-white">{student.name}</strong> is generated with 🆔 <span className="font-mono">{student.id}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Card Type Selector (Badge vs 🆔 ID Card vs Mini Pass) */}
        <div className="mt-3 p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 pl-1 flex items-center space-x-1">
            <span>🆔 Card Type:</span>
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCardType('badge')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                cardType === 'badge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🏷️ Badge
            </button>
            <button
              onClick={() => setCardType('id-card')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                cardType === 'id-card' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🆔 ID Card
            </button>
            <button
              onClick={() => setCardType('mini')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                cardType === 'mini' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🎫 Mini Pass
            </button>
          </div>
        </div>

        {/* Design & Background Picker Toolbar */}
        <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Theme Color & Wallpaper</span>
            </span>
            {customBgImage && (
              <button
                onClick={() => setCustomBgImage('')}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Remove Wallpaper
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCardDesign('midnight')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardDesign === 'midnight'
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              🌙 Midnight
            </button>
            <button
              onClick={() => setCardDesign('emerald')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardDesign === 'emerald'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              🌿 Emerald
            </button>
            <button
              onClick={() => setCardDesign('amber')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardDesign === 'amber'
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              🔥 Amber
            </button>
            <button
              onClick={() => setCardDesign('purple')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                cardDesign === 'purple'
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              💜 Royal
            </button>

            {/* Gallery Upload Button */}
            <input
              type="file"
              ref={bgInputRef}
              onChange={handleGalleryUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => bgInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1 ml-auto"
              title="Upload custom background wallpaper"
            >
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>BG Wallpaper</span>
            </button>

            {/* Logo Upload Button */}
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1"
              title="Upload logo to display on top of QR code"
            >
              <ImageIcon className="w-3 h-3 text-indigo-400" />
              <span>{customLogo ? 'Change Logo' : 'Add QR Logo'}</span>
            </button>
            {customLogo && (
              <button
                onClick={() => setCustomLogo('')}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        {/* Card Mockup Preview */}
        <div className="mt-4 flex justify-center overflow-x-auto py-2">
          {cardType === 'id-card' ? (
            /* HORIZONTAL ID CARD LAYOUT */
            <div
              ref={badgeRef}
              className={`w-96 border-2 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex items-center justify-between text-left space-x-4 transition-all duration-300 ${getDesignClasses(
                cardDesign
              )}`}
              style={
                customBgImage
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url(${customBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="flex flex-col items-center space-y-2 shrink-0">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-indigo-400 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-indigo-400 flex items-center justify-center text-slate-400 text-xl font-bold">
                    {student.name.charAt(0)}
                  </div>
                )}
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  🆔 {student.id}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-300 truncate">
                  {settings.schoolName}
                </div>
                <div className="text-[11px] font-bold text-white truncate">
                  {settings.courseName}
                </div>
                <div className="text-[10px] font-semibold text-slate-300">
                  Section: <span className="text-amber-400">{student.section}</span>
                </div>
                <div className="pt-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                    Student Name
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">
                    {student.name}
                  </h4>
                </div>
                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-mono pt-1">
                  OFFICIAL ID PASS
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-200 shrink-0 relative">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR for ${student.id}`} className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center text-slate-400 text-[10px]">QR...</div>
                )}
                {customLogo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-7 h-7 bg-white rounded-full p-0.5 shadow-md border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                      <img src={customLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : cardType === 'mini' ? (
            /* COMPACT MINI PASS LAYOUT */
            <div
              ref={badgeRef}
              className={`w-64 border-2 rounded-xl p-3.5 shadow-xl relative overflow-hidden flex flex-col items-center text-center space-y-2 transition-all duration-300 ${getDesignClasses(
                cardDesign
              )}`}
              style={
                customBgImage
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.85)), url(${customBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                {settings.schoolName}
              </div>
              <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-200 relative">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR`} className="w-32 h-32 object-contain" />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">QR...</div>
                )}
                {customLogo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 bg-white rounded-full p-0.5 shadow-md border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                      <img src={customLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white truncate max-w-[220px]">{student.name}</h4>
                <span className="text-[10px] font-mono font-bold text-indigo-300">🆔 ID: {student.id}</span>
                <span className="text-[10px] text-slate-300 block">Sec: {student.section}</span>
              </div>
            </div>
          ) : (
            /* VERTICAL BADGE LAYOUT */
            <div
              ref={badgeRef}
              className={`w-72 border-2 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-3 transition-all duration-300 ${getDesignClasses(
                cardDesign
              )}`}
              style={
                (customBgImage || settings.customBackgroundImage)
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.85)), url(${customBgImage || settings.customBackgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {/* Lanyard slot indicator */}
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto"></div>

              {/* School Header & Logo */}
              <div className="flex flex-col items-center space-y-1">
                {(customLogo || settings.schoolLogoUrl) && (
                  <div className="w-10 h-10 bg-white rounded-full border border-indigo-400/50 shadow-md flex items-center justify-center overflow-hidden mb-1 p-0.5">
                    <img src={customLogo || settings.schoolLogoUrl} alt="School Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                )}
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                  {settings.schoolName}
                </div>
                <div className="text-xs font-bold text-white">
                  {settings.courseName}
                </div>
                <div className="text-[11px] font-semibold text-slate-300">
                  Section: <span className="text-amber-400">{student.section}</span>
                </div>
              </div>

              {/* Student Photo */}
              {student.avatarUrl && (
                <div className="relative">
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400 shadow-md mx-auto"
                  />
                </div>
              )}

              {/* QR Code Canvas/Image */}
              <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${student.name}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                {customLogo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                      <img src={customLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Student Name
                </span>
                <h4 className="text-sm font-extrabold text-white leading-tight">
                  {student.name}
                </h4>
                <div className="pt-1">
                  <span className="text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full inline-block">
                    🆔 ID: {student.id}
                  </span>
                </div>
              </div>

              {/* Bottom watermark */}
              <div className="pt-1 text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                OFFICIAL ATTENDANCE QR PASS
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleShareToMessenger}
            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow"
            title="Share student QR pass details and ID to Messenger GC"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Messenger</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPNG}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 shadow"
            title="Download QR card as high-res PNG image"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-1"
            title="Print QR card"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
