import React from 'react';
import { 
  QrCode, 
  LayoutDashboard, 
  Users, 
  History, 
  FileText, 
  Printer, 
  Settings, 
  Clock, 
  ShieldCheck, 
  CalendarCheck,
  AlertCircle,
  Palette,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  Share2,
  LogOut
} from 'lucide-react';
import { SystemSettings, AdminUser } from '../types/attendance';
import { getCurrentEffectiveDateTime } from '../utils/dateUtils';
import { getThemeConfig } from '../utils/themeUtils';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: SystemSettings;
  adminUser: AdminUser;
  onOpenSettings: () => void;
  onToggleAdminLogin: () => void;
  onOpenShareModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  adminUser,
  onOpenSettings,
  onToggleAdminLogin,
  onOpenShareModal,
  onLogout,
}) => {
  const effective = getCurrentEffectiveDateTime(settings);
  const theme = getThemeConfig(settings.colorTheme);
  const { isOnline } = useOnlineStatus();

  const navItems = [
    { id: 'scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students (68)', icon: Users },
    { id: 'history', label: 'Attendance Records', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'qrcards', label: 'Print QR Cards', icon: Printer },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl no-print w-full overflow-hidden">
      <div className="w-full px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between py-1.5 sm:py-2.5 gap-1.5 sm:gap-3">
          {/* Logo & Section Title */}
          <div className="flex items-center space-x-2 cursor-pointer group min-w-0 shrink" onClick={() => setActiveTab('dashboard')}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr ${theme.headerGradient} flex items-center justify-center shadow-lg ${theme.glow} ring-2 ring-white/10 group-hover:scale-105 transition shrink-0`}>
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
                  {settings.shortName || settings.sectionName || 'BSIT Set B MS'}
                </span>
                <span className={`hidden xs:inline-flex px-1.5 py-0.2 text-[9px] font-semibold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} rounded-full shrink-0`}>
                  68
                </span>
                {settings.customBackgroundImage && (
                  <span className="hidden md:inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md">
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>Wallpaper</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate" title={settings.systemName}>
                {settings.systemName || 'QR Code-Based BSIT Set B Student Attendance Management System'}
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Online / Offline status badge */}
            <div
              className={`hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
              title={isOnline ? 'System is online & fully synced' : 'System is offline (Cached mode active)'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Share Link to GC Button */}
            <button
              onClick={onOpenShareModal}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition flex items-center space-x-1 text-xs font-bold shadow-sm"
              title="Share System Web Link to Messenger GC or Scan QR to install"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </button>

            {/* Quick Appearance / Wallpaper Button */}
            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-lg border transition flex items-center space-x-1 text-xs ${theme.badgeBg} ${theme.badgeText} border-slate-700 hover:border-slate-500`}
              title={`Active Theme: ${theme.name}. Click to change color theme or wallpaper picture from gallery.`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className={`w-1.5 h-1.5 rounded-full ${theme.previewBg} ring-1 ring-white/50`}></span>
            </button>

            {/* Staff Account & Profile Button */}
            <button
              onClick={onToggleAdminLogin}
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center space-x-1 text-xs font-medium"
              title={
                adminUser.role === 'Administrator'
                  ? `Logged in as Administrator (${adminUser.username}). Click to switch staff accounts or manage credentials.`
                  : `Logged in as ${adminUser.role} (${adminUser.username}). Account switching is restricted to Administrator.`
              }
            >
              <span className="text-xs">
                {adminUser.role === 'Secretary' ? '📋' : adminUser.role === 'Assistant Secretary' ? '📝' : '🛡️'}
              </span>
              <span className="font-bold text-white hidden md:inline text-xs">
                {adminUser.role === 'Administrator' ? 'Admin' : adminUser.role === 'Secretary' ? 'Secretary' : 'Asst Sec'}
              </span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-700"
              title="System Settings, Date/Time & Controls"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition flex items-center space-x-1 text-xs font-bold"
              title="Sign Out / Lock System"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 custom-scrollbar border-t border-slate-800/60 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? `${theme.primaryButton} text-white shadow-md ${theme.glow}`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Warning banner if custom date/time is active */}
      {settings.useCustomDateTime && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center text-xs text-amber-300 flex items-center justify-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Manual Date & Time Active:</strong> Recording attendance as <span className="underline font-mono">{effective.fullDisplayDate} at {effective.timeStr12}</span>.
          </span>
          <button 
            onClick={onOpenSettings} 
            className="ml-2 font-bold underline hover:text-white"
          >
            Adjust / Reset to Real Time
          </button>
        </div>
      )}
    </header>
  );
};
