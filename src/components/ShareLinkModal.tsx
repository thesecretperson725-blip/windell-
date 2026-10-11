import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  QrCode, 
  Send, 
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { SystemSettings } from '../types/attendance';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Compute the current system link
  const currentUrl = typeof window !== 'undefined'
    ? settings.systemUrl?.trim() || window.location.href.split('#')[0]
    : 'https://ais-dev-7x2gi563gzkxnsrup52nvq-626216580231.asia-southeast1.run.app';

  // Generate QR code for the link
  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate system link QR:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const announcementText = `📋 *${settings.schoolName || 'BSIT'} - ${settings.sectionName || 'Set B'} Attendance System*\n\nHey classmates and staff! Here is the official link to access and install our Attendance System:\n🔗 ${currentUrl}\n\n💡 *Tip to Install on your Phone:* Open the link in Chrome or Safari, tap menu (⋮ or share), and select "Add to Home Screen" to install it like a mobile app!`;

  const handleCopyAnnouncement = () => {
    navigator.clipboard.writeText(announcementText).then(() => {
      setCopiedAnnouncement(true);
      setTimeout(() => setCopiedAnnouncement(false), 3000);
    });
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.systemName || 'BSIT Attendance System',
          text: `Official link to access the BSIT Class Attendance System:`,
          url: currentUrl,
        });
        setShareSuccess('Shared successfully!');
        setTimeout(() => setShareSuccess(null), 3000);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      // Fallback
      handleCopyLink();
      setShareSuccess('Link copied to clipboard! Paste it into your Messenger GC.');
      setTimeout(() => setShareSuccess(null), 4000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `BSIT_Attendance_System_Link_QR.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <span>Share System Link to GC / Mobile</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Send
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Easily send to Group Chat (GC) or scan to install on phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Notification banner */}
          {shareSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{shareSuccess}</span>
            </div>
          )}

          {/* Direct URL Box */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              Official System Web Link (URL)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono text-[11px] sm:text-xs truncate select-all">
                {currentUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shrink-0 transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Open in Chrome Browser Action Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-bold text-white text-xs sm:text-sm flex items-center justify-center sm:justify-start space-x-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Open Portal Directly in Google Chrome</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Launch this system link instantly in Chrome to bookmark or add to your home screen.
              </p>
            </div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Chrome</span>
            </a>
          </div>

          {/* Quick Action Buttons: Share to GC / Native Share */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleShareNative}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to Messenger / GC</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAnnouncement}
              className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition ${
                copiedAnnouncement
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
              }`}
            >
              {copiedAnnouncement ? <Check className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4 text-indigo-400" />}
              <span>{copiedAnnouncement ? 'Announcement Copied!' : 'Copy GC Announcement'}</span>
            </button>
          </div>

          {/* QR Code Section for Scanning & Phone Installation */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl shadow-md shrink-0 flex flex-col items-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="System Link QR Code"
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-indigo-300 font-bold text-sm">
                <QrCode className="w-4 h-4" />
                <span>Scan with Phone Camera</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Classmates and instructors can point their phone camera at this QR code to instantly open the attendance portal in their mobile browser.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR Image</span>
                </button>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center space-x-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Open Link</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
