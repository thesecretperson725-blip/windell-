import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { 
  X, 
  Clock, 
  Calendar, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  Sliders, 
  Building2, 
  Volume2, 
  VolumeX,
  Sparkles,
  Edit3,
  Palette,
  Image as ImageIcon,
  Upload,
  Zap,
  Trash2,
  GraduationCap,
  MapPin,
  Type,
  Download,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  QrCode,
  Printer
} from 'lucide-react';
import { SystemSettings, ColorTheme, AdminUser } from '../types/attendance';
import { formatDateToWords, time24To12, padZero } from '../utils/dateUtils';
import { THEME_CONFIGS } from '../utils/themeUtils';
import { GOLDENSTATE_COLLEGE_LOGO_SVG } from './ClassListDocument';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getStoredStaffAccounts } from '../services/storageService';

interface DateTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onResetDatabase: () => void;
  adminUser?: AdminUser;
  onOpenAdminLogin?: () => void;
}

export const DateTimeModal: React.FC<DateTimeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDatabase,
  adminUser,
  onOpenAdminLogin,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const schoolLogoInputRef = useRef<HTMLInputElement | null>(null);
  const { canInstall, triggerInstallPrompt } = useOnlineStatus();

  const [settingsQrDataUrl, setSettingsQrDataUrl] = useState<string>('');
  const [settingsCardDesign, setSettingsCardDesign] = useState<'midnight' | 'emerald' | 'amber' | 'purple' | 'cyan'>('midnight');
  const settingsCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 1.5,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setSettingsQrDataUrl(url))
      .catch((err) => console.error('Failed to generate settings QR:', err));
  }, []);

  const handleExportSettingsQR = async () => {
    if (!settingsCardRef.current) return;
    try {
      const canvas = await html2canvas(settingsCardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `System_Portal_QR_Card_${formData.schoolName.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Failed to export system QR card:', err);
    }
  };

  const handlePrintSettingsQR = () => {
    window.print();
  };

  const handleInstallApp = async () => {
    if (canInstall) {
      await triggerInstallPrompt();
    } else {
      alert('To install this app on your device, use your browser menu (e.g. "Add to Home Screen" or "Install App").');
    }
  };

  if (!isOpen) return null;

  const handleSchoolLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.92);
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Limit max dimensions to 1600x1200 to keep within localStorage limits while maintaining high visual fidelity
        const maxDim = 1600;
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFormData((prev) => ({
            ...prev,
            customBackgroundImage: compressedDataUrl,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            customBackgroundImage: src,
          }));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const setPresetTime = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      useCustomDateTime: true,
      customTime: time,
    }));
  };

  const setPresetDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      useCustomDateTime: true,
      customDate: date,
    }));
  };

  const getNowFormattedDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Settings & Controls</h2>
              <p className="text-xs text-slate-400">Edit System Name, Date & Time, and Attendance Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* System Name & Branding Customization */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>System Title & Branding (Editable by Admin)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change the official system title displayed on the header, scanner, reports, and QR badges.
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Admin Feature
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  Full System Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. QR Code-Based BSIT Set B Student Attendance Management System"
                  value={formData.systemName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, systemName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Displayed on the scanner terminal, reports, and print headers.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Short Header Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BSIT Set B MS"
                  value={formData.shortName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, shortName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Displayed on the top navbar logo.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 text-xs">
              <label className="text-slate-300 font-semibold block mb-1">
                System / Application Web URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://ais-dev-7x2gi563gzkxnsrup52nvq-626216580231.asia-southeast1.run.app"
                value={formData.systemUrl || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, systemUrl: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Custom shared URL or domain for generating attendance QR codes & reports.
              </span>
            </div>
          </div>
          {/* Changeable Date & Time Mode Selection */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Manual Date & Time Simulation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows teacher/admin to simulate any date, early arrival, late arrival, or dismissal.
                </p>
              </div>

              {/* Mode Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useCustomDateTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      useCustomDateTime: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.useCustomDateTime ? (
              <div className="space-y-4 pt-3 border-t border-slate-700/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Attendance Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.customDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customDate: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setPresetDate('2026-09-26')}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-700/70 hover:bg-slate-700 text-slate-300 transition"
                      >
                        Sept. 26, 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDate(getNowFormattedDate())}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-700/70 hover:bg-slate-700 text-slate-300 transition"
                      >
                        Today
                      </button>
                    </div>
                  </div>

                  {/* Time Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Attendance Time (24h)</span>
                    </label>
                    <input
                      type="time"
                      value={formData.customTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customTime: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Displays as: <strong>{time24To12(formData.customTime)}</strong>
                    </span>
                  </div>
                </div>

                {/* Quick Time Presets */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Quick Scenario Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPresetTime('07:15')}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                        formData.customTime === '07:15'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-bold">7:15 AM</span>
                      <span className="text-[10px] text-emerald-400">Early Arrival</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetTime('07:25')}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                        formData.customTime === '07:25'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-bold">7:25 AM</span>
                      <span className="text-[10px] text-emerald-400">On-Time (Present)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetTime('07:45')}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                        formData.customTime === '07:45'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-bold">7:45 AM</span>
                      <span className="text-[10px] text-amber-400">Past Cutoff (Late)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetTime('16:30')}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                        formData.customTime === '16:30'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-bold">4:30 PM</span>
                      <span className="text-[10px] text-indigo-300">Dismissal (Time-Out)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Using live real-time clock from your device. Scans will be logged with the current computer time.
                </span>
              </div>
            )}
          </div>

          {/* Attendance Rules & Cutoff Threshold */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Attendance Status Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Late Arrival Cutoff Time (HH:mm)
                </label>
                <input
                  type="time"
                  value={formData.lateCutoffTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lateCutoffTime: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Scans on or before <strong>{time24To12(formData.lateCutoffTime)}</strong> are marked 
                  <span className="text-emerald-400 font-bold ml-1">Present</span>. Later scans are 
                  <span className="text-amber-400 font-bold ml-1">Late</span>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Dismissal / Time-Out Time
                </label>
                <input
                  type="time"
                  value={formData.autoTimeOutTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, autoTimeOutTime: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Expected checkout: <strong>{time24To12(formData.autoTimeOutTime)}</strong>
                </span>
              </div>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <div className="flex items-center space-x-2">
                {formData.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <span className="text-xs font-semibold text-slate-200">Audio Scan Feedback</span>
                  <p className="text-[11px] text-slate-400">Play chime on success, buzz on error/duplicate</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                }
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section & Institution Details */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Class & Institution Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Section</label>
                <input
                  type="text"
                  value={formData.sectionName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sectionName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Course / Program</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, courseName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Instructor / Professor</label>
                <input
                  type="text"
                  value={formData.instructorName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, instructorName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Official Class-List Document, Logo & Text Design */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Official Class-List Document, Logo & Text Design</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the official class-list layout, replace school logo, configure text design, borders, and academic metadata for PDF exports and print reports.
                </p>
              </div>
            </div>

            {/* School Logo Section (Upper-Left on Document) */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>School Logo (Upper Left Position)</span>
                </span>
                {formData.schoolLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, schoolLogoUrl: '' }))}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline"
                  >
                    Reset to Goldenstate Logo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-18 h-18 p-1.5 bg-white rounded-xl border border-slate-700 shadow-md flex items-center justify-center shrink-0">
                  <img
                    src={formData.schoolLogoUrl || GOLDENSTATE_COLLEGE_LOGO_SVG}
                    alt="School Logo Preview"
                    className="w-14 h-14 object-contain"
                  />
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={schoolLogoInputRef}
                    accept="image/*"
                    onChange={handleSchoolLogoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => schoolLogoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.schoolLogoUrl ? 'Change / Replace Logo' : 'Upload Custom School Logo'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: PNG, JPG, or SVG with transparent or white background. Placed at the top-left of the class list.
                  </p>
                </div>
              </div>
            </div>

            {/* School & Location Beside Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">School / College Name (Beside Logo)</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, schoolName: e.target.value }))
                  }
                  placeholder="e.g. Goldenstate College of Koronadal City"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">School Location (Beside Logo)</label>
                <input
                  type="text"
                  value={formData.schoolLocation || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, schoolLocation: e.target.value }))
                  }
                  placeholder="e.g. Koronadal City, South Cotabato"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Centered Class-List Title</label>
                <input
                  type="text"
                  value={formData.classListTitle || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, classListTitle: e.target.value }))
                  }
                  placeholder="e.g. BSIT1167MS B Class List"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Degree / Program</label>
                <input
                  type="text"
                  value={formData.degreeProgram || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, degreeProgram: e.target.value }))
                  }
                  placeholder="e.g. Bachelor of Science in Information Technology (BSIT)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Semester Information</label>
                <input
                  type="text"
                  value={formData.semester || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, semester: e.target.value }))
                  }
                  placeholder="e.g. 1st Semester"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={formData.academicYear || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, academicYear: e.target.value }))
                  }
                  placeholder="e.g. Academic Year 2026-2027"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Campus / Branch</label>
                <input
                  type="text"
                  value={formData.campusBranch || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, campusBranch: e.target.value }))
                  }
                  placeholder="e.g. Koronadal City Campus"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Course Instructor / Adviser</label>
                <input
                  type="text"
                  value={formData.instructorName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, instructorName: e.target.value }))
                  }
                  placeholder="e.g. Prof. J. Dela Cruz, MIT"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Text Design & Typography Controls */}
            <div className="pt-2 border-t border-slate-700/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-purple-400" />
                <span>Text Design & Document Typography</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Font Family */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Font Family</label>
                  <select
                    value={formData.documentFontFamily || 'sans'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentFontFamily: e.target.value as 'serif' | 'sans' | 'mono',
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sans">Clean Professional Sans (Inter / Helvetica)</option>
                    <option value="serif">Formal Academic Serif (Times / Georgia)</option>
                    <option value="mono">Official Monospace (Tabular Ledger)</option>
                  </select>
                </div>

                {/* Title Tracking */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Title Letter Spacing</label>
                  <select
                    value={formData.documentTitleTracking || 'wide'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentTitleTracking: e.target.value as 'normal' | 'wide' | 'widest',
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Standard Spacing</option>
                    <option value="wide">Wide Academic Tracking</option>
                    <option value="widest">Widest Formal Tracking</option>
                  </select>
                </div>

                {/* Table Border Color */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Table Border Style</label>
                  <select
                    value={formData.documentBorderColor || 'gray-300'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentBorderColor: e.target.value as 'gray-200' | 'gray-300' | 'gray-400',
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gray-200">Subtle Light Gray (border-gray-200)</option>
                    <option value="gray-300">Standard Thin Gray (border-gray-300)</option>
                    <option value="gray-400">Defined Slate Gray (border-gray-400)</option>
                  </select>
                </div>

                {/* Row Density */}
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Row Spacing Density</label>
                  <select
                    value={formData.documentDensity || 'normal'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentDensity: e.target.value as 'compact' | 'normal' | 'spacious',
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="compact">Compact (Fewer pages for print)</option>
                    <option value="normal">Normal (Standard academic)</option>
                    <option value="spacious">Spacious (Generous padding)</option>
                  </select>
                </div>
              </div>

              {/* Live Document Mini-Preview */}
              <div className="mt-3 p-3 bg-white text-black rounded-xl border border-gray-300 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-200 text-[10px] text-gray-500">
                  <span className="font-bold text-gray-700 uppercase tracking-wider">Document Preview (White Background & Formal Academic Style)</span>
                  <span className="italic">Print & PDF Live Preview</span>
                </div>

                {/* Header in Preview */}
                <div className="flex items-center gap-3 pb-2 border-b border-black">
                  <div className="w-10 h-10 shrink-0">
                    <img
                      src={formData.schoolLogoUrl || GOLDENSTATE_COLLEGE_LOGO_SVG}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase text-black leading-tight">
                      {formData.schoolName || 'Goldenstate College of Koronadal City'}
                    </h5>
                    <p className="text-[10px] text-gray-600 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-500 inline" />
                      <span>{formData.schoolLocation || 'Koronadal City, South Cotabato'}</span>
                    </p>
                  </div>
                </div>

                {/* Centered Bold Title */}
                <div className="text-center my-2">
                  <h4 className="text-xs font-black uppercase text-black tracking-wide border-b border-black inline-block px-2">
                    {formData.classListTitle || 'BSIT1167MS B Class List'}
                  </h4>
                </div>

                {/* Academic info below title */}
                <div className="text-[9px] text-gray-700 mb-2 flex justify-between bg-gray-50 p-1.5 border border-gray-200 rounded">
                  <span><strong>Semester:</strong> {formData.semester || '1st Semester'}</span>
                  <span><strong>AY:</strong> {formData.academicYear || '2026-2027'}</span>
                  <span><strong>Program:</strong> {formData.degreeProgram || 'BSIT'}</span>
                  <span><strong>Branch:</strong> {formData.campusBranch || 'Koronadal'}</span>
                </div>

                {/* 3-Column Table Preview */}
                <table className="w-full border-collapse border border-gray-300 text-[9px]">
                  <thead>
                    <tr className="bg-gray-100 text-black border-b border-gray-300 font-bold uppercase">
                      <th className="border border-gray-300 p-1 w-10 text-center">No.</th>
                      <th className="border border-gray-300 p-1 w-28 text-left">Student ID</th>
                      <th className="border border-gray-300 p-1 text-left">Student Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="border border-gray-300 p-1 text-center font-mono">1</td>
                      <td className="border border-gray-300 p-1 font-mono font-semibold">20261671477</td>
                      <td className="border border-gray-300 p-1 font-normal uppercase text-black">AGANAP, RYAN CHRISTIAN M.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fast Continuous Scan Settings */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Continuous Scanning & Auto-Clear (Speed Mode)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically clears the scan result state and resets input for faster back-to-back student scanning.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoClearScanInput}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      autoClearScanInput: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {formData.autoClearScanInput && (
              <div className="pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block">
                    Auto-Clear Delay: <strong className="text-emerald-400">{(formData.autoClearDelayMs / 1000).toFixed(1)} seconds</strong>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    How long the confirmation result stays on screen before resetting for next student.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {[1000, 1500, 1800, 2500].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, autoClearDelayMs: ms }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                        formData.autoClearDelayMs === ms
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {(ms / 1000).toFixed(1)}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Color Customizer */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>System Color Theme</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize the UI highlight color, buttons, and accent glow across the entire system.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {(Object.keys(THEME_CONFIGS) as ColorTheme[]).map((themeKey) => {
                const conf = THEME_CONFIGS[themeKey];
                const isSelected = (formData.colorTheme || 'indigo') === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, colorTheme: themeKey }))}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-400 shadow-md ring-1 ring-indigo-400/30'
                        : 'bg-slate-900 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${conf.previewBg} shrink-0 shadow-sm flex items-center justify-center`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 capitalize truncate">
                      {conf.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gallery Background Image Customizer */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Custom Wallpaper / Gallery Picture</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personalize the system background with campus photos, classroom pictures, or logos from your gallery.
                </p>
              </div>

              {formData.customBackgroundImage && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, customBackgroundImage: '' }))}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>

            {/* Hidden file input for gallery upload */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />

            {formData.customBackgroundImage ? (
              <div className="space-y-3 pt-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-32 w-full bg-slate-950 flex items-center justify-center group">
                  <img
                    src={formData.customBackgroundImage}
                    alt="Custom Wallpaper"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition space-x-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Different Picture</span>
                    </button>
                  </div>
                </div>

                {/* Background Dim / Overlay slider */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 font-semibold">
                    <span>Background Dim (Text Readability):</span>
                    <span className="font-mono text-indigo-400">{formData.backgroundDim || 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="5"
                    value={formData.backgroundDim || 75}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backgroundDim: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Brighter image (30%)</span>
                    <span>High readability (90%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-5 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition space-y-2"
                >
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Upload className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Upload Picture from Gallery / Files
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      Select your photo, campus picture, or classroom logo from your device.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 inline-flex items-center space-x-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Browse Gallery</span>
                  </button>
                </div>

                {/* Quick Gallery Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Or choose a sample wallpaper:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        name: 'Tech Lab',
                        url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
                      },
                      {
                        name: 'Campus Quad',
                        url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
                      },
                      {
                        name: 'Modern Library',
                        url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
                      },
                      {
                        name: 'Cyber Matrix',
                        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            customBackgroundImage: preset.url,
                          }))
                        }
                        className="group relative rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 h-14 transition text-left"
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center p-1">
                          <span className="text-[11px] font-bold text-white text-center">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Administrator Access & Security Section */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Administrator Access & Staff</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {adminUser?.isAuthenticated ? `${adminUser.role} Active` : 'Standard Mode'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Quick Staff Sign-in Presets for Administrator and Staff accounts:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAdminLogin) onOpenAdminLogin();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition flex items-center space-x-1.5 shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Manage Staff & Admin Access</span>
              </button>
            </div>

            {/* Quick Staff Presets Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              {getStoredStaffAccounts().map((acc) => {
                const roleEmoji = acc.role === 'Secretary' ? '📋' : acc.role === 'Assistant Secretary' ? '📝' : '🛡️';
                const shortRole = acc.role === 'Administrator' ? 'Admin' : acc.role === 'Secretary' ? 'Secretary' : 'Asst Sec';
                const titleColor = acc.role === 'Secretary' ? 'text-emerald-300' : acc.role === 'Assistant Secretary' ? 'text-cyan-300' : 'text-indigo-300';
                const isActive = adminUser?.role === acc.role;
                const isUserAdmin = adminUser?.isAuthenticated && adminUser?.role === 'Administrator';

                return (
                  <div key={acc.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className={`font-extrabold ${titleColor} block text-xs`}>{roleEmoji} {shortRole}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isUserAdmin ? (
                          <span className="text-slate-300">{acc.password}</span>
                        ) : (
                          <span className="flex items-center space-x-1 text-slate-500">
                            <span>••••••••</span>
                            <span className="text-[8px] text-amber-400 font-sans">🔒 Admin Only</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Active</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export & Print System QR Code with Design, Background & School Logo */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Export & Print System Portal QR Code (with Design, Background & School Logo)</span>
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                New Feature
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Customize and export or print the official system access QR code card complete with your institution's custom background wallpaper, theme design, and school logo.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettingsCardDesign('midnight')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  settingsCardDesign === 'midnight' ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                🌙 Midnight
              </button>
              <button
                type="button"
                onClick={() => setSettingsCardDesign('emerald')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  settingsCardDesign === 'emerald' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                🌿 Emerald
              </button>
              <button
                type="button"
                onClick={() => setSettingsCardDesign('amber')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  settingsCardDesign === 'amber' ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                🔥 Amber
              </button>
              <button
                type="button"
                onClick={() => setSettingsCardDesign('purple')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                  settingsCardDesign === 'purple' ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                💜 Royal
              </button>
            </div>

            {/* QR Card Preview Box */}
            <div className="flex justify-center py-2">
              <div
                ref={settingsCardRef}
                className={`w-72 border-2 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-3 ${
                  settingsCardDesign === 'emerald'
                    ? 'bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 border-emerald-500/60'
                    : settingsCardDesign === 'amber'
                    ? 'bg-gradient-to-b from-slate-950 via-amber-950/80 to-slate-950 border-amber-500/60'
                    : settingsCardDesign === 'purple'
                    ? 'bg-gradient-to-b from-slate-950 via-purple-950/80 to-slate-950 border-purple-500/60'
                    : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-indigo-500/60'
                }`}
                style={
                  formData.customBackgroundImage
                    ? {
                        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.85)), url(${formData.customBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {/* Lanyard slot */}
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto"></div>

                {/* School Logo & Header */}
                <div className="flex flex-col items-center space-y-1">
                  {formData.schoolLogoUrl ? (
                    <img src={formData.schoolLogoUrl} alt="School Logo" className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow border border-indigo-400/50" />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-600/30 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                      🏛️
                    </div>
                  )}
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    {formData.schoolName || 'School Name'}
                  </div>
                  <div className="text-xs font-bold text-white">
                    {formData.courseName || 'BSIT Attendance Portal'}
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-2.5 rounded-2xl shadow-inner border border-slate-200 relative">
                  {settingsQrDataUrl ? (
                    <img src={settingsQrDataUrl} alt="System Portal QR" className="w-32 h-32 object-contain" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">Generating...</div>
                  )}
                  {formData.schoolLogoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 bg-white rounded-full p-0.5 shadow-md border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                        <img src={formData.schoolLogoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-center space-y-0.5">
                  <div className="text-[11px] font-bold text-white">Official System Access Pass</div>
                  <div className="text-[9px] text-amber-400 font-mono">{formData.sectionName} &bull; {formData.semester}</div>
                </div>
              </div>
            </div>

            {/* Export & Print Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportSettingsQR}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition border border-slate-700 shadow"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export QR PNG</span>
              </button>
              <button
                type="button"
                onClick={handlePrintSettingsQR}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Card</span>
              </button>
            </div>
          </div>

          {/* Download App / PWA Install Section */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Download & Install System App</h4>
                <p className="text-[11px] text-slate-400">
                  Install this attendance system on your device for fast offline access and PWA support.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallApp}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </button>
          </div>

          {/* Reset Database / Factory Initializer */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Reset to Original 68 Students & Samples</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Restores the complete list of 68 BSIT Set B students and sample attendance.
              </p>
            </div>

            {showResetConfirm ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetDatabase();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                >
                  Yes, Reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 text-xs rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-500/20 transition flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 sticky bottom-0 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 text-sm font-semibold rounded-lg shadow-lg flex items-center space-x-2 transition ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{savedSuccess ? 'Saved!' : 'Apply Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
