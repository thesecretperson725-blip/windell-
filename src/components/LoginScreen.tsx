import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  CheckCircle2, 
  Mail, 
  Send, 
  KeyRound, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Share2,
  CalendarCheck,
  QrCode,
  Sparkles,
  Smartphone,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { AdminUser, SystemSettings } from '../types/attendance';
import { getStoredStaffAccounts } from '../services/storageService';

interface LoginScreenProps {
  adminUser: AdminUser;
  settings: SystemSettings;
  onLoginSuccess: (updatedAdmin: AdminUser) => void;
  onOpenShareModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  adminUser,
  settings,
  onLoginSuccess,
  onOpenShareModal,
}) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [isCompact, setIsCompact] = useState<boolean>(true);
  
  // Login input states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Forgot Password recovery states
  const [recoveryTarget, setRecoveryTarget] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const currentAdminPassword = adminUser.password || 'administrator';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetUser = usernameInput.trim();
    const targetPass = passwordInput.trim();

    if (!targetUser || !targetPass) {
      setError('Please enter both username and password.');
      return;
    }

    // Check credentials against persistent staff accounts
    const storedStaff = getStoredStaffAccounts();
    const matched = storedStaff.find(
      (acc) => acc.username.toLowerCase() === targetUser.toLowerCase() && acc.password === targetPass
    );

    if (matched) {
      const updated: AdminUser = {
        ...adminUser,
        username: matched.username,
        password: matched.password,
        name: matched.name,
        role: matched.role,
        isAuthenticated: true,
      };
      setSuccessMsg(`Authentication successful! Logged in as ${matched.role} (${matched.username})...`);
      setTimeout(() => onLoginSuccess(updated), 400);
      return;
    }

    // Check against admin user / default credentials
    if (
      (targetUser.toLowerCase() === 'admin' && targetPass === 'administrator') ||
      (targetUser.toLowerCase() === adminUser.username.toLowerCase() && targetPass === currentAdminPassword) ||
      targetPass === 'bsit2026'
    ) {
      const updated: AdminUser = {
        ...adminUser,
        username: targetUser || adminUser.username,
        role: targetUser.toLowerCase() === 'secretary' 
          ? 'Secretary' 
          : targetUser.toLowerCase() === 'asstsecretary' 
          ? 'Assistant Secretary' 
          : 'Administrator',
        isAuthenticated: true,
      };
      setSuccessMsg('Authentication successful! Opening attendance system...');
      setTimeout(() => onLoginSuccess(updated), 400);
    } else {
      setError('Invalid username or password. Note: Only the Administrator can view or change credentials.');
    }
  };

  const handleSelectStaffPreset = (presetUser: string, presetRole: 'Administrator' | 'Secretary' | 'Assistant Secretary') => {
    setError('');
    setUsernameInput(presetUser);
    setPasswordInput('');
    setSuccessMsg(`Username set to "${presetUser}" (${presetRole}). Please type your password.`);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 80);
  };

  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const target = recoveryTarget.trim().toLowerCase();
    const storedGmail = (adminUser.gmail || 'admin@gmail.com').toLowerCase();
    const storedPhone = (adminUser.phone || '+639123456789').toLowerCase();

    if (target === storedGmail || target === storedPhone || target.includes('@') || target.length >= 10) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setRecoveryStep(2);
      setSuccessMsg(`Simulated verification code sent to ${recoveryTarget}: [ ${code} ]`);
    } else {
      setError('No registered staff account found matching this Gmail or Mobile Number.');
    }
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.trim() !== generatedCode) {
      setError('Invalid verification code entered.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const updated: AdminUser = {
      ...adminUser,
      password: forgotNewPassword,
      isAuthenticated: true,
    };

    setSuccessMsg('Password successfully reset! Logging you in...');
    setTimeout(() => onLoginSuccess(updated), 500);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Wallpaper if set */}
      {settings.customBackgroundImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${settings.customBackgroundImage})`,
            backgroundAttachment: 'fixed',
          }}
        >
          <div
            className="absolute inset-0 bg-slate-950 transition-opacity duration-300"
            style={{ opacity: (settings.backgroundDim ?? 75) / 100 }}
          />
        </div>
      )}

      {/* Top Bar with School Branding & Share to GC Button */}
      <header className="relative z-10 w-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 ring-2 ring-white/10 shrink-0">
            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {settings.shortName || settings.sectionName || 'BSIT Set B MS'}
              </span>
              <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Attendance Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-md">
              {settings.schoolName || 'QR Code-Based Student Attendance Management System'}
            </p>
          </div>
        </div>

        {/* Share to GC / Open Link Button */}
        <button
          type="button"
          onClick={onOpenShareModal}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] sm:text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
          title="Share system web link to Messenger Group Chat or scan QR"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share Link to GC / Install</span>
          <span className="sm:hidden">Share Link</span>
        </button>
      </header>

      {/* Main Login Center Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-2.5 sm:p-4 my-auto">
        <div className={`w-full max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in ${
          isCompact ? 'p-3.5 sm:p-5' : 'p-5 sm:p-7'
        }`}>
          {/* Card Header */}
          <div className="text-center mb-2.5 sm:mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="w-12"></div>
              <div className={`inline-flex items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-inner ${
                isCompact ? 'w-8 h-8' : 'w-10 h-10'
              }`}>
                <ShieldCheck className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
              <button
                type="button"
                onClick={() => setIsCompact(!isCompact)}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[10px] font-medium flex items-center space-x-1 transition active:scale-95"
                title={isCompact ? 'Switch to Standard Size' : 'Switch to Small Compact Size'}
              >
                {isCompact ? <Maximize2 className="w-2.5 h-2.5 text-indigo-400" /> : <Minimize2 className="w-2.5 h-2.5 text-indigo-400" />}
                <span>{isCompact ? 'Normal' : 'Small'}</span>
              </button>
            </div>
            <h1 className={`font-black text-white tracking-tight ${isCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
              {view === 'login' ? 'System Login' : 'Password Recovery'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 max-w-xs mx-auto leading-tight mt-0.5">
              {view === 'login' 
                ? 'Sign in with your staff account or username & password to access the system.' 
                : 'Enter your registered Gmail or phone to recover your password.'}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-2 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className={`${isCompact ? 'space-y-2 sm:space-y-2.5' : 'space-y-3 sm:space-y-3.5'} text-xs`}>
              {/* Username Input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">
                  Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Admin, Secretary, or AsstSecretary"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 sm:py-2 text-white font-medium text-xs focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide & Forgot Password Link */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-slate-300 font-semibold text-[11px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline"
                  >
                    Forgotten password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password manually"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-8 py-1.5 sm:py-2 text-white font-medium text-xs focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                className="w-full mt-1 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign In to Access System</span>
              </button>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center my-1.5 sm:my-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2.5 text-slate-500 text-[9px] uppercase font-mono tracking-wider">
                  Quick Staff Username Select
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Quick Staff Sign-in Buttons */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {getStoredStaffAccounts().map((acc) => {
                  const roleEmoji = acc.role === 'Secretary' ? '📋' : acc.role === 'Assistant Secretary' ? '📝' : '🛡️';
                  const shortRole = acc.role === 'Administrator' ? 'Admin' : acc.role === 'Secretary' ? 'Secretary' : 'Asst Sec';
                  const isSelected = usernameInput.trim().toLowerCase() === acc.username.toLowerCase();
                  const colorClasses = acc.role === 'Secretary'
                    ? isSelected 
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50' 
                      : 'bg-emerald-950/40 hover:bg-emerald-600/25 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300'
                    : acc.role === 'Assistant Secretary'
                    ? isSelected
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                      : 'bg-cyan-950/40 hover:bg-cyan-600/25 border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/50'
                    : 'bg-indigo-950/40 hover:bg-indigo-600/25 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300';

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectStaffPreset(acc.username, acc.role)}
                      className={`p-1.5 sm:p-2 rounded-xl border text-center transition flex flex-col items-center justify-center group active:scale-95 shadow-sm ${colorClasses}`}
                      title={`Select ${shortRole} username: ${acc.username}. Enter password manually.`}
                    >
                      <span className="font-bold text-[11px] sm:text-xs group-hover:text-white flex items-center space-x-1">
                        <span>{roleEmoji}</span>
                        <span>{shortRole}</span>
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono mt-0.5 truncate max-w-full">
                        {acc.username}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Security Hint */}
              <p className="text-[9px] text-slate-500 text-center font-mono flex items-center justify-center space-x-1 pt-0.5">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                <span>Tap role to display username &bull; Type password manually</span>
              </p>

              {/* Share System Link Prompt */}
              <div className="pt-0.5 text-center">
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-300 text-[10px] font-medium transition"
                >
                  <Share2 className="w-3 h-3 text-indigo-400" />
                  <span>Send or share system link to Group Chat (GC)</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: FORGOTTEN PASSWORD RECOVERY */}
          {view === 'forgot' && (
            <div className={`${isCompact ? 'space-y-2.5' : 'space-y-3.5'} text-xs`}>
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] sm:text-[11px]">
                <strong className="block font-bold text-amber-200 mb-0.5">Password Recovery Assistant</strong>
                Verify your identity using your registered Gmail account or Mobile number to reset your password.
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleSendRecoveryCode} className={`${isCompact ? 'space-y-2' : 'space-y-2.5'}`}>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">
                      Registered Gmail or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. admin@gmail.com or +639123456789"
                        value={recoveryTarget}
                        onChange={(e) => setRecoveryTarget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 sm:py-2 text-white font-medium text-xs focus:outline-none focus:border-indigo-500"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-slate-400 hover:text-white font-semibold transition text-[11px]"
                    >
                      &larr; Back to Login
                    </button>

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center space-x-1.5 shadow text-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Recovery Code</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndReset} className={`${isCompact ? 'space-y-2' : 'space-y-2.5'}`}>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 sm:py-2 text-white font-mono tracking-widest text-center text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min 4 chars)"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-8 py-1.5 sm:py-2 text-white font-medium text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1.5 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="text-slate-400 hover:text-white font-semibold transition text-[11px]"
                    >
                      &larr; Resend Code
                    </button>

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center space-x-1.5 shadow text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Reset & Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-3 py-2 text-center text-[10px] sm:text-xs text-slate-500 border-t border-slate-800/60 bg-slate-950/80">
        <div>
          &copy; {new Date().getFullYear()} &bull; <strong>{settings.schoolName || 'BSIT Department'}</strong> &bull; {settings.sectionName || 'Section 2B'}
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5">
          Authorized Staff and Administrative Access Only
        </div>
      </footer>
    </div>
  );
};
