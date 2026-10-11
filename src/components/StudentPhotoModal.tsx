import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  RotateCw,
  Trash2,
  Check,
  AlertCircle,
  User,
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { Student } from '../types/attendance';

interface StudentPhotoModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (studentId: string, photoDataUrl: string | undefined) => void;
}

export const StudentPhotoModal: React.FC<StudentPhotoModalProps> = ({
  student,
  isOpen,
  onClose,
  onSavePhoto,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'gallery'>('camera');
  const [previewPhoto, setPreviewPhoto] = useState<string | undefined>(undefined);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize preview with student's current avatar when opened
  useEffect(() => {
    if (student) {
      setPreviewPhoto(student.avatarUrl);
      setCameraError(null);
    }
  }, [student, isOpen]);

  // Stop camera tracks helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload a photo from your gallery instead.');
      } else {
        setCameraError(`Unable to start camera (${error.message || 'Unknown error'}). Try uploading from gallery.`);
      }
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Manage camera state based on activeMode and modal visibility
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode, startCamera, stopCamera]);

  // Handle closing modal
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Switch camera between front and back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Helper to compress and resize image via canvas
  const processImage = (imageSource: HTMLVideoElement | HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const maxSize = 360; // 360x360 square avatar

    let width = (imageSource as HTMLVideoElement).videoWidth || (imageSource as HTMLImageElement).naturalWidth || maxSize;
    let height = (imageSource as HTMLVideoElement).videoHeight || (imageSource as HTMLImageElement).naturalHeight || maxSize;

    // Crop center square
    const minDim = Math.min(width, height);
    const startX = (width - minDim) / 2;
    const startY = (height - minDim) / 2;

    canvas.width = maxSize;
    canvas.height = maxSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // If front camera, mirror image for natural selfie look
    if (imageSource instanceof HTMLVideoElement && facingMode === 'user') {
      ctx.translate(maxSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      imageSource,
      startX,
      startY,
      minDim,
      minDim,
      0,
      0,
      maxSize,
      maxSize
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Capture snapshot from live camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !isCameraActive) return;

    // Trigger visual flash feedback
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const dataUrl = processImage(videoRef.current);
    if (dataUrl) {
      setPreviewPhoto(dataUrl);
    }
  };

  // Handle file chosen from device gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const compressed = processImage(img);
        setPreviewPhoto(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const compressed = processImage(img);
          setPreviewPhoto(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Save photo and close
  const handleSave = () => {
    if (!student) return;
    onSavePhoto(student.id, previewPhoto);
    handleClose();
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPreviewPhoto(undefined);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 text-slate-100 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Profile Photo</h3>
              <p className="text-xs text-slate-400">
                {student.name} &bull; <span className="font-mono text-indigo-300">{student.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Switcher: Camera vs Gallery */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center space-x-2 ${
              activeMode === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Use Device Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('gallery')}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center space-x-2 ${
              activeMode === 'gallery'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload from Gallery</span>
          </button>
        </div>

        {/* Camera Mode Viewfinder */}
        {activeMode === 'camera' && (
          <div className="mt-4 space-y-3">
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                } ${!isCameraActive ? 'hidden' : ''}`}
              />

              {/* Shutter flash animation */}
              {isShutterFlashing && (
                <div className="absolute inset-0 bg-white pointer-events-none animate-ping opacity-75" />
              )}

              {/* Portrait Oval Framing Guide */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-56 rounded-full border-2 border-dashed border-cyan-400/70 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                  <span className="absolute bottom-2 text-[10px] text-cyan-300 font-medium px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-cyan-400/30">
                    Align face inside guide
                  </span>
                </div>
              )}

              {/* Camera Error / Placeholder */}
              {!isCameraActive && (
                <div className="p-4 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  {cameraError ? (
                    <div className="text-xs text-rose-300 max-w-[220px] mx-auto space-y-1">
                      <p className="font-semibold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-[11px] inline-flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Camera</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Starting camera preview...</p>
                  )}
                </div>
              )}
            </div>

            {/* Camera Controls */}
            {isCameraActive && (
              <div className="flex items-center justify-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                  title="Switch Front/Back Camera"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition flex items-center space-x-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gallery / File Upload Mode */}
        {activeMode === 'gallery' && (
          <div className="mt-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Click to browse or drag & drop photo</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  JPG, PNG, or WebP photo from your device
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                Select Image File
              </button>
            </div>
          </div>
        )}

        {/* Selected / Current Photo Preview Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {previewPhoto ? (
              <img
                src={previewPhoto}
                alt="Selected preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-white block">
                {previewPhoto ? 'Profile Photo Selected' : 'No Photo Assigned'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {previewPhoto
                  ? 'Ready to save for attendance badge & scanning.'
                  : 'Take photo or upload image.'}
              </span>
            </div>
          </div>

          {previewPhoto && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition text-xs flex items-center space-x-1"
              title="Remove Profile Photo"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
