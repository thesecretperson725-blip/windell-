import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  FlipHorizontal, 
  Upload, 
  Keyboard, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Sparkles, 
  UserCheck, 
  Volume2, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Zap,
  Check
} from 'lucide-react';
import { Student, AttendanceRecord, SystemSettings, ScanMode, AttendanceStatus } from '../types/attendance';
import { getCurrentEffectiveDateTime, determineAttendanceStatus } from '../utils/dateUtils';
import { sounds } from '../utils/audioBeep';
import { getThemeConfig } from '../utils/themeUtils';

interface ScannerSectionProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SystemSettings;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onOpenSettings: () => void;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({
  students,
  records,
  settings,
  onRecordAttendance,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const theme = getThemeConfig(settings.colorTheme);
  const [scanMode, setScanMode] = useState<ScanMode>('auto');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual input state
  const [manualIdInput, setManualIdInput] = useState<string>('');
  const [selectedStudentForTest, setSelectedStudentForTest] = useState<string>('');

  // Scan feedback state
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    student?: Student;
    record?: AttendanceRecord;
    timestamp?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cooldownRef = useRef<boolean>(false);
  const autoClearTimerRef = useRef<number | null>(null);

  const effective = getCurrentEffectiveDateTime(settings);

  // Cleanup auto-clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) {
        window.clearTimeout(autoClearTimerRef.current);
      }
    };
  }, []);

  // Helper to schedule auto-clear of scanner input state
  const scheduleAutoClear = useCallback(() => {
    if (!settings.autoClearScanInput) return;
    if (autoClearTimerRef.current) {
      window.clearTimeout(autoClearTimerRef.current);
    }
    const delay = settings.autoClearDelayMs || 1800;
    autoClearTimerRef.current = window.setTimeout(() => {
      setLastScanResult(null);
      setManualIdInput('');
      setSelectedStudentForTest('');
    }, delay);
  }, [settings.autoClearScanInput, settings.autoClearDelayMs]);

  // Process a scanned Student ID
  const handleStudentIdIdentified = useCallback((scannedText: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1500); // reduced cooldown to 1.5s for faster continuous scanning

    const cleanedId = scannedText.trim();
    if (!cleanedId) return;

    // Look up student in directory
    const student = students.find(
      (s) => s.id === cleanedId || s.id.toLowerCase() === cleanedId.toLowerCase()
    );

    if (!student) {
      if (settings.soundEnabled) sounds.playError();
      setLastScanResult({
        type: 'error',
        title: 'Unrecognized Student ID',
        message: `No BSIT Set B student found with ID: "${cleanedId}". Please verify the QR code.`,
      });
      scheduleAutoClear();
      return;
    }

    // Find existing attendance for current effective date
    const existingIndex = records.findIndex(
      (r) => r.studentId === student.id && r.date === effective.dateStr
    );
    const existingRecord = existingIndex !== -1 ? records[existingIndex] : null;

    // Evaluate action based on scanMode and existing record
    if (scanMode === 'time_in') {
      if (existingRecord && existingRecord.timeIn) {
        // Duplicate time-in protection
        if (settings.soundEnabled) sounds.playWarning();
        setLastScanResult({
          type: 'duplicate',
          title: 'Duplicate Scan Detected',
          message: `${student.name} already timed in at ${existingRecord.timeIn} for ${effective.fullDisplayDate}.`,
          student,
          record: existingRecord,
          timestamp: effective.timeStr12,
        });
        scheduleAutoClear();
        return;
      }

      // Record new Time-In
      const status: AttendanceStatus = determineAttendanceStatus(
        effective.timeStr24,
        settings.lateCutoffTime
      );

      const newRecord: AttendanceRecord = {
        id: `${student.id}_${effective.dateStr}`,
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        section: student.section,
        date: effective.dateStr,
        timeIn: effective.timeStr12,
        timeOut: null,
        status,
        remarks: status === 'Late' ? `Late scan (Cutoff: ${settings.lateCutoffTime})` : 'On-time Time-In',
        timestampIn: Date.now(),
      };

      onRecordAttendance(newRecord);
      if (settings.soundEnabled) sounds.playSuccess();
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch {}

      setLastScanResult({
        type: 'success',
        title: `Time-In Recorded (${status})`,
        message: `${student.name} marked as ${status} at ${effective.timeStr12}.`,
        student,
        record: newRecord,
        timestamp: effective.timeStr12,
      });
      scheduleAutoClear();
      return;
    }

    if (scanMode === 'time_out') {
      if (!existingRecord || !existingRecord.timeIn) {
        if (settings.soundEnabled) sounds.playWarning();
        setLastScanResult({
          type: 'error',
          title: 'No Time-In Record Found',
          message: `${student.name} has not recorded a Time-In for ${effective.fullDisplayDate} yet. Please record Time-In first.`,
          student,
        });
        scheduleAutoClear();
        return;
      }

      if (existingRecord.timeOut) {
        // Duplicate time-out protection
        if (settings.soundEnabled) sounds.playWarning();
        setLastScanResult({
          type: 'duplicate',
          title: 'Duplicate Time-Out',
          message: `${student.name} has already timed out at ${existingRecord.timeOut} today.`,
          student,
          record: existingRecord,
          timestamp: effective.timeStr12,
        });
        scheduleAutoClear();
        return;
      }

      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        timeOut: effective.timeStr12,
        timestampOut: Date.now(),
        remarks: `${existingRecord.remarks || ''} | Timed-Out at ${effective.timeStr12}`,
      };

      onRecordAttendance(updatedRecord);
      if (settings.soundEnabled) sounds.playSuccess();

      setLastScanResult({
        type: 'success',
        title: 'Time-Out Recorded Successfully',
        message: `${student.name} recorded Time-Out at ${effective.timeStr12}.`,
        student,
        record: updatedRecord,
        timestamp: effective.timeStr12,
      });
      scheduleAutoClear();
      return;
    }

    // Smart Auto Mode:
    // If no existing record or no timeIn -> Time-In
    // If has timeIn and no timeOut -> Time-Out
    // If has both -> Duplicate protection
    if (!existingRecord || !existingRecord.timeIn) {
      const status: AttendanceStatus = determineAttendanceStatus(
        effective.timeStr24,
        settings.lateCutoffTime
      );

      const newRecord: AttendanceRecord = {
        id: `${student.id}_${effective.dateStr}`,
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        section: student.section,
        date: effective.dateStr,
        timeIn: effective.timeStr12,
        timeOut: null,
        status,
        remarks: status === 'Late' ? `Late arrival (Cutoff: ${settings.lateCutoffTime})` : 'On-time arrival',
        timestampIn: Date.now(),
      };

      onRecordAttendance(newRecord);
      if (settings.soundEnabled) sounds.playSuccess();
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}

      setLastScanResult({
        type: 'success',
        title: `Time-In Recorded (${status})`,
        message: `${student.name} recorded Time-In at ${effective.timeStr12}.`,
        student,
        record: newRecord,
        timestamp: effective.timeStr12,
      });
      scheduleAutoClear();
    } else if (!existingRecord.timeOut) {
      // Record Time-Out
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        timeOut: effective.timeStr12,
        timestampOut: Date.now(),
        remarks: `${existingRecord.remarks || ''} | Dismissal logged`,
      };

      onRecordAttendance(updatedRecord);
      if (settings.soundEnabled) sounds.playSuccess();

      setLastScanResult({
        type: 'success',
        title: 'Time-Out Recorded',
        message: `${student.name} recorded Time-Out at ${effective.timeStr12}.`,
        student,
        record: updatedRecord,
        timestamp: effective.timeStr12,
      });
      scheduleAutoClear();
    } else {
      // Both already done
      if (settings.soundEnabled) sounds.playWarning();
      setLastScanResult({
        type: 'duplicate',
        title: 'Attendance Completed Today',
        message: `${student.name} already recorded both Time-In (${existingRecord.timeIn}) and Time-Out (${existingRecord.timeOut}) for today.`,
        student,
        record: existingRecord,
        timestamp: effective.timeStr12,
      });
      scheduleAutoClear();
    }
  }, [students, records, settings, effective, scanMode, onRecordAttendance, scheduleAutoClear]);

  // Video scan animation frame loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleStudentIdIdentified(code.data);
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [isCameraActive, handleStudentIdIdentified]);

  // Start Camera with seamless fallback and direct access
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
      } catch {
        // Fallback to generic video true if facingMode constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      let errMsg = 'Camera access was denied or is unavailable.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Camera permission was denied. Click "Allow" on the browser prompt or use instant options below.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'No video camera device was found on this system.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = 'Your camera is already in use by another application or tab.';
        } else {
          errMsg = err.message || errMsg;
        }
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Camera lifecycle
  useEffect(() => {
    if (isCameraActive) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, scanFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle image upload scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleStudentIdIdentified(code.data);
          } else {
            if (settings.soundEnabled) sounds.playError();
            setLastScanResult({
              type: 'error',
              title: 'No QR Code Detected',
              message: 'Could not detect a valid QR code in the uploaded image. Please try a clearer image.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualIdInput.trim()) {
      handleStudentIdIdentified(manualIdInput.trim());
      setManualIdInput('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Active Recording Session Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Ready For Scanning
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {settings.shortName ? `${settings.shortName} QR Scanner Terminal` : (settings.systemName || 'BSIT Set B QR Scanner Terminal')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.systemName || 'QR Code-Based BSIT Set B Student Attendance Management System'} &bull; Hold QR code to camera or enter Student ID.
          </p>
        </div>

        {/* Current Active Date & Time Pill (Clickable) */}
        <div 
          onClick={onOpenSettings}
          className="bg-slate-900/90 border border-slate-700/90 hover:border-indigo-500/50 cursor-pointer rounded-xl p-3 flex items-center space-x-3 transition group"
        >
          <div className={`p-2.5 rounded-lg ${settings.useCustomDateTime ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left font-mono">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-sans">
              <span>Logging Timestamp</span>
              {settings.useCustomDateTime && (
                <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                  Manual Clock
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white">
              {effective.fullDisplayDate}
            </div>
            <div className="text-xs text-indigo-300 font-extrabold">
              {effective.timeStr12}
            </div>
          </div>
          <div className="text-xs text-slate-500 group-hover:text-indigo-400 font-sans pl-1">
            Change ⚙️
          </div>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera & Scanner Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
            {/* Scan Mode Selector Tabs & Continuous Scan Auto-Clear Toggle */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">
                  Scanner Action Mode:
                </label>
                {/* Fast Continuous Scan Auto-Clear Toggle */}
                {onUpdateSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        autoClearScanInput: !settings.autoClearScanInput,
                      });
                    }}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                      settings.autoClearScanInput
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title="Automatically clears student result & resets input for the next student scan"
                  >
                    <Zap className={`w-3 h-3 ${settings.autoClearScanInput ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Auto-Clear for Continuous Scan:</span>
                    <span className="font-bold uppercase text-[10px]">
                      {settings.autoClearScanInput ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setScanMode('auto')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                    scanMode === 'auto'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Smart Auto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('time_in')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                    scanMode === 'time_in'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>🟢 Time-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScanMode('time_out')}
                  className={`py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                    scanMode === 'time_out'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>🔴 Time-Out</span>
                </button>
              </div>
            </div>

            {/* Camera Viewport Canvas Container */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Aiming Reticle Overlay when camera is active */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 sm:w-64 sm:h-64 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>
                    
                    {/* Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-cyan-400/50 shadow-lg"></div>
                  </div>
                  <span className="absolute bottom-4 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-[11px] text-indigo-300 font-medium border border-indigo-500/30">
                    Align student QR code within frame
                  </span>
                </div>
              )}

              {/* Inactive Camera Placeholder */}
              {!isCameraActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Camera is Off</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Click &ldquo;Start Camera Scanner&rdquo; to use your webcam, or select a file/manual test below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 mx-auto"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera Scanner</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Turn On Camera</span>
                  </button>
                )}

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                      stopCamera();
                      setTimeout(startCamera, 300);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-lg transition flex items-center space-x-1.5"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                )}
              </div>

              {/* Upload QR image button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-lg transition flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Scan QR Image File</span>
                </button>
              </div>
            </div>

            {/* Camera error message if permission blocked */}
            {cameraError && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Camera Notice:</span> {cameraError}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20 text-[11px]">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg border border-amber-500/40 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Camera Permission</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1"
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>Upload QR Image Instead</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Simulation / Manual Scanner Barcode Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              <span>Barcode Gun / Manual Student ID Input</span>
            </h3>

            {/* Type/Scan Form */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter Student ID (e.g. 20261671477 or scan USB barcode)..."
                  value={manualIdInput}
                  onChange={(e) => setManualIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Submit ID
              </button>
            </form>

            {/* Quick 1-Click Test Simulator for BSIT Set B */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Quick Test Any BSIT Set B Student:
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedStudentForTest}
                  onChange={(e) => setSelectedStudentForTest(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose from 68 enrolled students --</option>
                  {students.map((student, idx) => (
                    <option key={student.id} value={student.id}>
                      {idx + 1}. {student.name} ({student.id})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!selectedStudentForTest}
                  onClick={() => {
                    if (selectedStudentForTest) {
                      handleStudentIdIdentified(selectedStudentForTest);
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl border border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Simulate QR Scan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Scan Result & Student Verification Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Scan Verification & Status</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Late Cutoff: <strong className="text-indigo-300">{settings.lateCutoffTime}</strong>
                </span>
              </div>

              {/* Dynamic Scan Result Card */}
              {lastScanResult ? (
                <div
                  className={`p-5 rounded-2xl border transition-all animate-fade-in ${
                    lastScanResult.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : lastScanResult.type === 'duplicate'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    {lastScanResult.type === 'success' && (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    )}
                    {lastScanResult.type === 'duplicate' && (
                      <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                    )}
                    {lastScanResult.type === 'error' && (
                      <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <h4 className="font-bold text-base text-white">
                        {lastScanResult.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {lastScanResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Student Details Card if student recognized */}
                  {lastScanResult.student && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-900/80 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center space-x-3 pb-2 border-b border-slate-800/80">
                        {lastScanResult.student.avatarUrl ? (
                          <img
                            src={lastScanResult.student.avatarUrl}
                            alt={lastScanResult.student.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-white text-base shrink-0">
                            {lastScanResult.student.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white text-sm block truncate">
                            {lastScanResult.student.name}
                          </span>
                          <span className="font-mono text-indigo-300 text-xs block font-bold">
                            ID: {lastScanResult.student.id}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {lastScanResult.student.course} - {lastScanResult.student.section}
                          </span>
                        </div>
                      </div>

                      {lastScanResult.record && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                          <div className="bg-slate-950 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Time In</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              {lastScanResult.record.timeIn || '—'}
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Time Out</span>
                            <span className="font-mono font-bold text-indigo-400 text-xs">
                              {lastScanResult.record.timeOut || '—'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Auto-Clear Continuous Feedback indicator / manual dismiss */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    {settings.autoClearScanInput ? (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Zap className="w-3 h-3 animate-pulse" />
                        <span>Auto-clearing for next student...</span>
                      </span>
                    ) : (
                      <span>Ready for next scan</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLastScanResult(null)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
                    >
                      Clear Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center my-auto h-52">
                  <UserCheck className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-400">Waiting for QR scan...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hold badge to camera or use manual input
                  </p>
                </div>
              )}
            </div>

            {/* Quick Session Stats Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Total Enrolled BSIT Set B:</span>
                <span className="font-bold text-white">{students.length} students</span>
              </div>
              <div className="flex justify-between">
                <span>Today's Total Scans:</span>
                <span className="font-bold text-indigo-400">
                  {records.filter((r) => r.date === effective.dateStr && r.timeIn).length} recorded
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
