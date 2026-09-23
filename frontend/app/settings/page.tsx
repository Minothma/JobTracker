'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiFetch } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import {
  User,
  Shield,
  Sliders,
  Database,
  KeyRound,
  CheckCircle2,
  Briefcase,
  FileText,
  Video,
  Award,
  Globe,
  HardDriveDownload,
  Lock,
} from 'lucide-react';

interface AccountStats {
  applications_count: number;
  resumes_count: number;
  offers_count: number;
  interviews_count: number;
}

const CURRENCIES = [
  { label: 'USD ($) - US Dollar', value: 'USD' },
  { label: 'EUR (€) - Euro', value: 'EUR' },
  { label: 'GBP (£) - British Pound', value: 'GBP' },
  { label: 'LKR (Rs) - Sri Lankan Rupee', value: 'LKR' },
  { label: 'CAD (C$) - Canadian Dollar', value: 'CAD' },
  { label: 'AUD (A$) - Australian Dollar', value: 'AUD' },
  { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
  { label: 'SGD (S$) - Singapore Dollar', value: 'SGD' },
];

const WORK_MODES = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'On-site', value: 'ON_SITE' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'data'>('account');
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences State
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultWorkMode, setDefaultWorkMode] = useState('REMOTE');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);

  // Data Export State
  const [isExportingJson, setIsExportingJson] = useState(false);

  useEffect(() => {
    // Load local storage preferences
    const savedCurrency = localStorage.getItem('jobtracker_default_currency');
    if (savedCurrency) setDefaultCurrency(savedCurrency);

    const savedWorkMode = localStorage.getItem('jobtracker_default_work_mode');
    if (savedWorkMode) setDefaultWorkMode(savedWorkMode);

    const savedAlerts = localStorage.getItem('jobtracker_email_alerts');
    if (savedAlerts !== null) setEmailAlertsEnabled(savedAlerts === 'true');

    // Fetch account stats
    apiFetch<AccountStats>('/users/me/stats')
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('jobtracker_default_currency', defaultCurrency);
    localStorage.setItem('jobtracker_default_work_mode', defaultWorkMode);
    localStorage.setItem('jobtracker_email_alerts', String(emailAlertsEnabled));
    showToast('Preferences saved successfully!', 'success');
  };

  const handleExportJsonBackup = async () => {
    try {
      setIsExportingJson(true);
      const backupData = await apiFetch<any>('/users/me/export');

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobtracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Complete JSON backup downloaded successfully!', 'success');
    } catch {
      showToast('Failed to generate full data backup', 'error');
    } finally {
      setIsExportingJson(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100">
        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#FAFAFA]">
            Account & Preferences
          </h1>
          <p className="text-xs text-zinc-400">
            Manage your credentials, default application settings, and offline data backups
          </p>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
            <span>Applications</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#FAFAFA] mt-2">
            {loadingStats ? '—' : stats?.applications_count ?? 0}
          </p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Resumes</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#FAFAFA] mt-2">
            {loadingStats ? '—' : stats?.resumes_count ?? 0}
          </p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <Video className="w-3.5 h-3.5 text-zinc-400" />
            <span>Interviews</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[#FAFAFA] mt-2">
            {loadingStats ? '—' : stats?.interviews_count ?? 0}
          </p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-zinc-400" />
            <span>Offers</span>
          </div>
          <p className="text-xl font-mono font-semibold text-emerald-400 mt-2">
            {loadingStats ? '—' : stats?.offers_count ?? 0}
          </p>
        </div>
      </div>

      {/* Main Settings Navigation & Content */}
      <div className="bg-[#121214] border border-[#27272A] rounded-lg overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#27272A] bg-[#0A0A0B] p-1 gap-1">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md transition-colors ${
              activeTab === 'account'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Security & Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md transition-colors ${
              activeTab === 'preferences'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Defaults & Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md transition-colors ${
              activeTab === 'data'
                ? 'bg-[#18181B] text-zinc-100 border border-[#27272A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>Data & Backups</span>
          </button>
        </div>

        {/* Tab 1: Account & Security */}
        {activeTab === 'account' && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* User Info Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-md bg-[#0A0A0B] border border-[#27272A] gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A] font-mono font-semibold text-xs flex items-center justify-center">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#FAFAFA]">
                    {user?.email}
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Account ID: {user?.id}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                Active Session
              </span>
            </div>

            {/* Password Change Form */}
            <div className="space-y-3 max-w-lg">
              <div className="flex items-center gap-2 text-[#FAFAFA] font-semibold text-sm">
                <KeyRound className="w-4 h-4 text-zinc-400" />
                <h3>Change Account Password</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Ensure your account is protected with a secure password containing at least 8 characters.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-3.5 pt-1">
                <Input
                  label="Current Password *"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />

                <Input
                  label="New Password *"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm New Password *"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div className="pt-2">
                  <Button type="submit" size="sm" isLoading={isChangingPassword} className="text-xs font-mono">
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === 'preferences' && (
          <div className="p-5 sm:p-6 space-y-5 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                Application Defaults
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize your preferred currencies and work mode for quicker application creation.
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <Select
                label="Preferred Default Currency"
                options={CURRENCIES}
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              />

              <Select
                label="Default Work Mode"
                options={WORK_MODES}
                value={defaultWorkMode}
                onChange={(e) => setDefaultWorkMode(e.target.value)}
              />

              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-[#27272A] bg-[#0A0A0B]"
                  />
                  <div>
                    <span className="text-xs font-medium text-zinc-200">
                      Enable Daily Stale Application Alerts
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Receive morning reminders for applications waiting &gt;14 days without an interview.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#27272A]">
                <Button type="submit" size="sm" className="text-xs font-mono">
                  <Sliders className="w-3.5 h-3.5 mr-1.5" />
                  Save Preferences
                </Button>
              </div>
            </form>

            {/* 1-Click Browser Job Clipper Bookmarklet Widget */}
            <div className="mt-6 pt-5 border-t border-[#27272A] space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[#18181B] text-zinc-300 border border-[#27272A]">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <h4 className="text-xs font-semibold text-[#FAFAFA]">
                  1-Click Browser Job Clipper (Bookmarklet)
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag this button to your Bookmarks Bar. Whenever you visit a job posting on LinkedIn or Indeed, click the bookmarklet to clip it directly to JobTracker.
              </p>

              <div className="pt-1">
                <a
                  href={`javascript:(function(){var u=window.location.href;var t=document.title;var s=window.getSelection?window.getSelection().toString():'';var target='${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}/board?clip_url='+encodeURIComponent(u)+'&clip_title='+encodeURIComponent(t)+'&clip_desc='+encodeURIComponent(s);window.open(target,'_blank');})();`}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Drag this button to your browser Bookmarks Bar!', 'info');
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-200 font-mono text-xs cursor-grab active:cursor-grabbing select-none transition-colors"
                  title="Drag me to your Bookmarks toolbar!"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Clip to JobTracker</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Data & Backups */}
        {activeTab === 'data' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                Data Portability & Offline Backup
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download a complete, offline copy of all your job applications, notes, interview rounds, offers, and linked resumes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Complete JSON Payload */}
              <div className="p-4 rounded-md border border-[#27272A] bg-[#0A0A0B] flex flex-col justify-between space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs font-mono">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Complete JSON Database Export</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Exports everything structured: all applications, interview history, notes timeline, compensation matrices, and resume metadata in standard JSON format.
                  </p>
                </div>

                <Button
                  onClick={handleExportJsonBackup}
                  isLoading={isExportingJson}
                  size="sm"
                  className="w-full justify-center text-xs font-mono"
                >
                  <HardDriveDownload className="w-3.5 h-3.5 mr-1.5" />
                  Download JSON Backup
                </Button>
              </div>

              {/* Data Safety Info */}
              <div className="p-4 rounded-md border border-[#27272A] bg-[#0A0A0B] flex flex-col justify-between space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Data Privacy & Ownership</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your job application data, resume versions, and compensation numbers are strictly private to your account. You can backup or export your complete history anytime.
                  </p>
                </div>

                <div className="text-[11px] font-mono text-emerald-400">
                  Data Portability Compliant
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
