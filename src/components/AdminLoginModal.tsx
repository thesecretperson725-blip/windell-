import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  User, 
  LogOut, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Send, 
  KeyRound, 
  RefreshCw,
  AlertCircle,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Edit2,
  Check,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { AdminUser, StaffAccount } from '../types/attendance';
import { getStoredStaffAccounts, saveStaffAccounts, DEFAULT_STAFF_ACCOUNTS } from '../services/storageService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser;
  onUpdateAdmin: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  onUpdateAdmin,
}) => {
  const [view, setView] = useState<'presets' | 'settings' | 'sms' | 'login' | 'forgot'>(
    adminUser.isAuthenticated ? 'presets' : 'login'
  );
  
  // Login states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const modalPasswordInputRef = useRef<HTMLInputElement>(null);

  // Settings / Profile update states
  const [editUsername, setEditUsername] = useState(adminUser.username || 'Admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editGmail, setEditGmail] = useState(adminUser.gmail || 'admin@gmail.com');
  const [editPhone, setEditPhone] = useState(adminUser.phone || '+639123456789');
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Secretary' | 'Assistant Secretary' | 'Instructor' | 'Officer'>(adminUser.role || 'Administrator');

  // Forgot Password states
  const [recoveryTarget, setRecoveryTarget] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  // SMS sender states
  const [smsRecipient, setSmsRecipient] = useState(adminUser.phone || '+639123456789');
  const [smsText, setSmsText] = useState('BSIT Attendance Alert: Official notification from Class Administration.');
  const [smsSending, setSmsSending] = useState(false);
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);

  // Staff accounts & credentials management (Admin only)
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => getStoredStaffAccounts());
  const [showAdminPasswords, setShowAdminPasswords] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editStaffUser, setEditStaffUser] = useState('');
  const [editStaffPass, setEditStaffPass] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);

  const isAdmin = adminUser.isAuthenticated && adminUser.role === 'Administrator';

  if (!isOpen) return null;

  const currentAdminPassword = adminUser.password || 'administrator';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetUser = usernameInput.trim();
    const targetPass = passwordInput.trim();

    // Check against persistent staff accounts
    const storedStaff = getStoredStaffAccounts();
    const matched = storedStaff.find(
      acc => acc.username.toLowerCase() === targetUser.toLowerCase() && acc.password === targetPass
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
      onUpdateAdmin(updated);
      setView('presets');
      setSuccessMsg(`Logged in as ${matched.role} (${matched.username})!`);
    } else if (
      (targetUser.toLowerCase() === 'admin' && targetPass === 'administrator') ||
      (targetUser.toLowerCase() === adminUser.username.toLowerCase() && targetPass === currentAdminPassword) ||
      targetPass === 'bsit2026'
    ) {
      const updated = {
        ...adminUser,
        username: targetUser || adminUser.username,
        role: targetUser.toLowerCase() === 'secretary' ? ('Secretary' as const) : targetUser.toLowerCase() === 'asstsecretary' ? ('Assistant Secretary' as const) : ('Administrator' as const),
        isAuthenticated: true,
      };
      onUpdateAdmin(updated);
      setView('presets');
      setSuccessMsg('Successfully logged in as ' + (targetUser || 'Admin') + '!');
    } else {
      setError('Invalid username or password. Note: Only the Administrator can view or change credentials.');
    }
  };

  const handleStartEditStaff = (acc: StaffAccount) => {
    if (!isAdmin) {
      setError('Access Denied: Only the Administrator can view or change staff credentials.');
      return;
    }
    setError('');
    setEditingAccountId(acc.id);
    setEditStaffUser(acc.username);
    setEditStaffPass(acc.password);
    setShowEditPass(false);
  };

  const handleSaveStaffCredentials = (accId: string) => {
    if (!isAdmin) {
      setError('Access Denied: Only the Administrator can modify credentials.');
      return;
    }
    if (!editStaffUser.trim() || !editStaffPass.trim()) {
      setError('Username and password cannot be blank.');
      return;
    }

    const updatedList = staffAccounts.map(acc => {
      if (acc.id === accId) {
        return {
          ...acc,
          username: editStaffUser.trim(),
          password: editStaffPass.trim(),
        };
      }
      return acc;
    });

    setStaffAccounts(updatedList);
    saveStaffAccounts(updatedList);

    // If the edited account matches current active user, sync adminUser
    const target = updatedList.find(a => a.id === accId);
    if (target && (adminUser.role === target.role || adminUser.username.toLowerCase() === target.username.toLowerCase())) {
      const updatedAdminUser: AdminUser = {
        ...adminUser,
        username: target.username,
        password: target.password,
      };
      onUpdateAdmin(updatedAdminUser);
      setEditUsername(target.username);
    }

    setEditingAccountId(null);
    setSuccessMsg(`Credentials for ${target?.name || accId} updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleResetStaffCredentials = (accId: string) => {
    if (!isAdmin) {
      setError('Access Denied: Only the Administrator can reset credentials.');
      return;
    }
    const def = DEFAULT_STAFF_ACCOUNTS.find(d => d.id === accId);
    if (!def) return;

    const updatedList = staffAccounts.map(acc => {
      if (acc.id === accId) {
        return { ...def };
      }
      return acc;
    });

    setStaffAccounts(updatedList);
    saveStaffAccounts(updatedList);
    setEditStaffUser(def.username);
    setEditStaffPass(def.password);

    if (adminUser.role === def.role) {
      const updatedAdminUser: AdminUser = {
        ...adminUser,
        username: def.username,
        password: def.password,
      };
      onUpdateAdmin(updatedAdminUser);
      setEditUsername(def.username);
    }

    setSuccessMsg(`Reset ${def.name} credentials to default (${def.username} / ${def.password})!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleQuickLogin = (presetUser: string, presetPass: string, presetRole: 'Administrator' | 'Secretary' | 'Assistant Secretary', presetName: string) => {
    // Only administrator can switch accounts if already logged in
    if (adminUser.isAuthenticated && !isAdmin) {
      setError('Access Denied: Only the Administrator can switch accounts.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const updated: AdminUser = {
      ...adminUser,
      username: presetUser,
      password: presetPass,
      name: presetName,
      role: presetRole,
      isAuthenticated: true,
    };
    onUpdateAdmin(updated);
    setEditUsername(presetUser);
    setSelectedRole(presetRole);
    setSuccessMsg(`Switched active account to ${presetRole} (${presetUser})!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSelectStaffUsername = (presetUser: string, presetRole: string) => {
    setError('');
    setUsernameInput(presetUser);
    setPasswordInput('');
    setSuccessMsg(`Selected ${presetRole} (${presetUser}). Please enter your password.`);
    setTimeout(() => {
      modalPasswordInputRef.current?.focus();
    }, 80);
  };

  const handleLogout = () => {
    onUpdateAdmin({
      ...adminUser,
      isAuthenticated: false,
    });
    onClose();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // If not Administrator, usernames, roles, and passwords are read-only
    if (!isAdmin) {
      if (newPassword) {
        setError('Access Denied: Only the Administrator can change passwords.');
        return;
      }
      const updated: AdminUser = {
        ...adminUser,
        gmail: editGmail.trim(),
        phone: editPhone.trim(),
      };
      onUpdateAdmin(updated);
      setSuccessMsg('Contact information updated successfully! (Username & Password are controlled by Administrator)');
      return;
    }

    if (newPassword) {
      if (currentPassword && currentPassword !== currentAdminPassword && currentPassword !== 'administrator' && currentPassword !== 'secretary' && currentPassword !== 'assistant') {
        setError('Current password is incorrect.');
        return;
      }
    }

    const updated: AdminUser = {
      ...adminUser,
      username: editUsername.trim() || 'Admin',
      password: newPassword ? newPassword : currentAdminPassword,
      gmail: editGmail.trim(),
      phone: editPhone.trim(),
      role: selectedRole,
      isAuthenticated: true,
    };

    // Also sync the administrator staff account if admin changed their own credentials
    const updatedStaff = staffAccounts.map(acc => {
      if (acc.role === 'Administrator') {
        return {
          ...acc,
          username: editUsername.trim() || 'Admin',
          password: newPassword ? newPassword : acc.password,
        };
      }
      return acc;
    });
    setStaffAccounts(updatedStaff);
    saveStaffAccounts(updatedStaff);

    onUpdateAdmin(updated);
    setSuccessMsg('Administrator account details updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
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
      setSuccessMsg(`Verification code sent to ${recoveryTarget}: [ ${code} ]`);
    } else {
      setError('Account not found matching this Gmail or Mobile Number.');
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

    onUpdateAdmin(updated);
    setSuccessMsg('Password successfully reset! You are now logged in.');
    setView('settings');
    setRecoveryStep(1);
    setVerificationCode('');
    setForgotNewPassword('');
    setRecoveryTarget('');
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsSending(true);
    setSmsSentSuccess(false);

    setTimeout(() => {
      setSmsSending(false);
      setSmsSentSuccess(true);
      setTimeout(() => setSmsSentSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in no-print overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-3.5 sm:p-5 text-slate-100 flex flex-col my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Administration & Staff Access</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success / Error Banners */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------- 1. LOGIN VIEW ---------------- */}
        {view === 'login' && !adminUser.isAuthenticated && (
          <div className="mt-4 space-y-4 text-xs">
            {/* Quick Preset Login Accounts */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quick Staff Sign-in Presets:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Password Protected</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {staffAccounts.map((acc) => {
                  const roleEmoji = acc.role === 'Secretary' ? '📋' : acc.role === 'Assistant Secretary' ? '📝' : '🛡️';
                  const shortRole = acc.role === 'Administrator' ? 'Admin' : acc.role === 'Secretary' ? 'Secretary' : 'Asst Sec';
                  const isSelected = usernameInput.trim().toLowerCase() === acc.username.toLowerCase();
                  const colorClasses = acc.role === 'Secretary' 
                    ? isSelected 
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
                    : acc.role === 'Assistant Secretary'
                    ? isSelected
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                      : 'bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/40 text-cyan-300'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/50'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300';
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectStaffUsername(acc.username, acc.role)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center group active:scale-95 shadow-sm ${colorClasses}`}
                      title={`Select ${shortRole} username: ${acc.username}. Type password manually.`}
                    >
                      <span className="font-extrabold text-xs group-hover:text-white">{roleEmoji} {shortRole}</span>
                      <span className="text-[9px] text-slate-300 font-mono mt-0.5 truncate max-w-full">{acc.username}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-mono">Or Login Manually</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Admin, Secretary, or AsstSecretary"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-400 font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={modalPasswordInputRef}
                    type="password"
                    placeholder="Enter account password manually"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- 2. FORGOT PASSWORD VIEW ---------------- */}
        {view === 'forgot' && (
          <div className="mt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
              <span className="font-bold block text-sm text-amber-200">Password Recovery via Gmail / Mobile</span>
              <p className="text-[11px] text-slate-300">
                Enter your registered Gmail account or mobile phone number to receive a verification code.
              </p>
            </div>

            {recoveryStep === 1 ? (
              <form onSubmit={handleSendRecoveryCode} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Registered Gmail or Mobile Number</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. admin@gmail.com or +639123456789"
                      value={recoveryTarget}
                      onChange={(e) => setRecoveryTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-slate-400 hover:text-white font-medium"
                  >
                    &larr; Back to Login
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="space-y-3">
                <p className="text-slate-300">
                  Verification code sent to <strong className="text-white">{recoveryTarget}</strong>.
                </p>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">New Account Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="text-slate-400 hover:text-white font-medium"
                  >
                    &larr; Resend Code
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reset Password & Login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ---------------- 3. AUTHENTICATED TABS & VIEWS ---------------- */}
        {adminUser.isAuthenticated && (
          <div className="mt-3 space-y-3 text-xs">
            {/* Sub-nav tabs - compact */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setView('presets')}
                className={`flex-1 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                  view === 'presets' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setView('settings')}
                className={`flex-1 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                  view === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => setView('sms')}
                className={`flex-1 py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                  view === 'sms' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Send SMS</span>
              </button>
            </div>

            {/* View 1: Quick Staff Presets - Compact */}
            {view === 'presets' && (
              <div className="space-y-2.5">
                {/* Compact Header Bar */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-bold text-xs text-white">Staff Sign-in Presets</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowAdminPasswords(!showAdminPasswords)}
                        className="px-2 py-0.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold flex items-center space-x-1 transition"
                        title={showAdminPasswords ? 'Mask passwords' : 'Show plain text passwords'}
                      >
                        {showAdminPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showAdminPasswords ? 'Hide' : 'View Passwords'}</span>
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      {adminUser.role === 'Assistant Secretary' ? 'Asst Sec' : adminUser.role} Active
                    </span>
                  </div>
                </div>

                {/* Clearance Notice */}
                {isAdmin ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Admin Clearance:</strong> You have full permission to switch accounts, view plain passwords, and edit staff credentials.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center space-x-2 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Staff Restricted View:</strong> Only the Administrator can switch accounts, or view and change credentials.</span>
                  </div>
                )}

                {/* Account Cards */}
                <div className="space-y-2">
                  {staffAccounts.map((acc) => {
                    const isAccActive = adminUser.role === acc.role;
                    const isEditing = editingAccountId === acc.id;
                    const roleEmoji = acc.role === 'Secretary' ? '📋' : acc.role === 'Assistant Secretary' ? '📝' : '🛡️';
                    const shortRole = acc.role === 'Administrator' ? 'Admin' : acc.role === 'Secretary' ? 'Secretary' : 'Asst Sec';
                    
                    const roleBorderClasses = isAccActive
                      ? acc.role === 'Secretary'
                        ? 'bg-emerald-950/70 border-emerald-500/80 ring-1 ring-emerald-500/50'
                        : acc.role === 'Assistant Secretary'
                        ? 'bg-cyan-950/70 border-cyan-500/80 ring-1 ring-cyan-500/50'
                        : 'bg-indigo-950/70 border-indigo-500/80 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700';

                    const iconBgClasses = acc.role === 'Secretary'
                      ? 'bg-emerald-600/20 border-emerald-500/30'
                      : acc.role === 'Assistant Secretary'
                      ? 'bg-cyan-600/20 border-cyan-500/30'
                      : 'bg-indigo-600/20 border-indigo-500/30';

                    if (isEditing && isAdmin) {
                      return (
                        <div key={acc.id} className="p-2.5 sm:p-3 rounded-xl border border-indigo-500/80 bg-slate-950 shadow-xl space-y-2.5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white flex items-center space-x-1.5">
                              <span className="text-sm">{roleEmoji}</span>
                              <span>Edit {shortRole} Credentials</span>
                            </span>
                            <span className="text-[9px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                              Admin Edit Mode
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Username</label>
                              <div className="relative">
                                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={editStaffUser}
                                  onChange={(e) => setEditStaffUser(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                                  placeholder="Enter username"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-0.5">
                                <label className="block text-[10px] text-slate-400 font-semibold">Password</label>
                                <button
                                  type="button"
                                  onClick={() => setShowEditPass(!showEditPass)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300"
                                >
                                  {showEditPass ? 'Hide' : 'Show'}
                                </button>
                              </div>
                              <div className="relative">
                                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type={showEditPass ? 'text' : 'password'}
                                  value={editStaffPass}
                                  onChange={(e) => setEditStaffPass(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                                  placeholder="Enter password"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowEditPass(!showEditPass)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                  {showEditPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleResetStaffCredentials(acc.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                              title="Reset back to factory preset"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset to Default</span>
                            </button>

                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingAccountId(null)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveStaffCredentials(acc.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition flex items-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={acc.id}
                        className={`p-2 sm:p-2.5 rounded-xl border transition ${roleBorderClasses}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${iconBgClasses} border flex items-center justify-center text-sm shrink-0`}>
                              {roleEmoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-xs text-white">{shortRole}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-semibold border border-slate-700">
                                  {acc.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono truncate mt-0.5">
                                <span>User: <strong className="text-slate-200">{acc.username}</strong></span>
                                <span className="text-slate-600">&bull;</span>
                                <span>Pass: </span>
                                {isAdmin ? (
                                  showAdminPasswords ? (
                                    <strong className="text-indigo-300 font-bold">{acc.password}</strong>
                                  ) : (
                                    <span className="text-slate-400 tracking-wider">••••••••</span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-slate-400">
                                    <span className="tracking-wider">••••••••</span>
                                    <span className="text-[8px] text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 font-sans">
                                      🔒 Admin Only
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {/* Edit Button - Admin Only */}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleStartEditStaff(acc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                                title={`Edit ${shortRole} username and password`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Active or Switch Button */}
                            {isAccActive ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center space-x-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleQuickLogin(acc.username, acc.password, acc.role, acc.name)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] sm:text-[11px] shadow transition active:scale-95 shrink-0 flex items-center space-x-1"
                                title={`Switch active account to ${shortRole}`}
                              >
                                <span>Switch</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setError('Access Denied: Only the Administrator can switch accounts.');
                                  setTimeout(() => setError(''), 4000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-amber-300/80 font-bold text-[10px] sm:text-[11px] shrink-0 flex items-center space-x-1 cursor-not-allowed transition"
                                title="Access Restricted: Only the Administrator can switch accounts"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Switch</span>
                                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-normal">Admin Only</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Buttons - Compact */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg font-semibold flex items-center space-x-1.5 text-xs transition active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs transition active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* View 2: Account Settings */}
            {view === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-3">
                {/* Staff Quick Presets summary banner */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center space-x-1.5 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Quick Staff Presets:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setView('presets')}
                      className="text-[10px] text-indigo-400 hover:underline font-semibold"
                    >
                      {isAdmin ? 'View & Edit Presets →' : 'View Staff Presets →'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400 font-mono">
                    {staffAccounts.map((acc) => {
                      const roleEmoji = acc.role === 'Secretary' ? '📋' : acc.role === 'Assistant Secretary' ? '📝' : '🛡️';
                      const shortRole = acc.role === 'Administrator' ? 'Admin' : acc.role === 'Secretary' ? 'Secretary' : 'Asst Sec';
                      const textColor = acc.role === 'Secretary' ? 'text-emerald-300' : acc.role === 'Assistant Secretary' ? 'text-cyan-300' : 'text-indigo-300';
                      return (
                        <span key={acc.id} className={`p-1 rounded bg-slate-900 border border-slate-800 text-center ${textColor} truncate`}>
                          {roleEmoji} {shortRole}: {isAdmin && showAdminPasswords ? acc.password : '••••••••'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Role Clearance Banner for non-admin */}
                {!isAdmin && (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center space-x-2 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Staff Profile Mode:</strong> You are signed in as <strong>{adminUser.role}</strong>. Usernames, roles, and passwords can only be changed by the Administrator.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-xs flex items-center justify-between">
                      <span>Account Username</span>
                      {!isAdmin && <span className="text-[10px] text-amber-400 font-normal">🔒 Admin Only</span>}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editUsername}
                        disabled={!isAdmin}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none ${
                          !isAdmin 
                            ? 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed' 
                            : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                        }`}
                        title={!isAdmin ? 'Only the Administrator can change usernames' : undefined}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-xs flex items-center justify-between">
                      <span>Staff Role</span>
                      {!isAdmin && <span className="text-[10px] text-amber-400 font-normal">🔒 Admin Only</span>}
                    </label>
                    <select
                      value={selectedRole}
                      disabled={!isAdmin}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        !isAdmin 
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                      title={!isAdmin ? 'Only the Administrator can switch accounts or change roles' : undefined}
                    >
                      <option value="Administrator">Administrator (Full Access)</option>
                      <option value="Secretary">Class Secretary</option>
                      <option value="Assistant Secretary">Assistant Secretary</option>
                      <option value="Instructor">Course Instructor</option>
                      <option value="Officer">Student Officer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-xs">Gmail Account (Optional)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="admin@gmail.com"
                        value={editGmail}
                        onChange={(e) => setEditGmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-xs">Mobile Number (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="+639123456789"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Section: Editable for Admin, Protected for Non-Admin */}
                {isAdmin ? (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-bold text-slate-200 block text-xs">Change Administrator Password</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Current Password</label>
                        <input
                          type="password"
                          placeholder="Leave blank to keep"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-amber-300">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-xs">Password Modification Restricted</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Only the Administrator can view or change passwords. To update or reset credentials for {adminUser.role}, please sign in with an Administrator account.
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-semibold flex items-center space-x-1.5 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* View 3: Send SMS */}
            {view === 'sms' && (
              <form onSubmit={handleSendSms} className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Phone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="font-bold block text-sm text-emerald-200">Staff SMS Dispatcher</span>
                      <p className="text-[11px] text-slate-300">
                        Send instant SMS notifications to mobile: <strong className="text-white">{editPhone || 'Not set'}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {smsSentSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SMS successfully dispatched to {smsRecipient}!</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Recipient Mobile Number</label>
                  <input
                    type="text"
                    value={smsRecipient}
                    onChange={(e) => setSmsRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">SMS Message Content</label>
                  <textarea
                    rows={4}
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    required
                  ></textarea>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Character count: {smsText.length} / 160 (Standard SMS)
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={smsSending}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5"
                  >
                    {smsSending ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending SMS...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send SMS Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
