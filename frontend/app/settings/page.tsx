'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiFetch } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  User,
  Shield,
  Sliders,
  Database,
  KeyRound,
  Download,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  FileText,
  Video,
  Award,
  DollarSign,
  Globe,
  Bell,
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Account & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your credentials, default application settings, and offline data backups
        </p>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <span>Applications</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {loadingStats ? '—' : stats?.applications_count ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Resumes</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {loadingStats ? '—' : stats?.resumes_count ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Video className="w-4 h-4 text-amber-500" />
            <span>Interviews</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {loadingStats ? '—' : stats?.interviews_count ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Offers</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {loadingStats ? '—' : stats?.offers_count ?? 0}
          </p>
        </div>
      </div>

      {/* Main Settings Navigation & Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'account'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'preferences'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Defaults & Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'data'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data & Backups</span>
          </button>
        </div>

        {/* Tab 1: Account & Security */}
        {activeTab === 'account' && (
          <div className="p-6 sm:p-8 space-y-8">
            {/* User Info Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {user?.email}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Account ID: {user?.id}
                  </p>
                </div>
              </div>
              <Badge variant="success">Active Session</Badge>
            </div>

            {/* Password Change Form */}
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
                <KeyRound className="w-5 h-5 text-sky-500" />
                <h3>Change Account Password</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure your account is protected with a secure password containing at least 8 characters.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
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
                  <Button type="submit" isLoading={isChangingPassword}>
                    <Lock className="w-4 h-4 mr-1.5" />
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === 'preferences' && (
          <div className="p-6 sm:p-8 space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Application Defaults
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize your preferred currencies and work mode for quicker application creation.
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-5">
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

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Enable Daily Stale Application Alerts (AWS SES)
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive morning email reminders for applications waiting &gt;14 days without an interview.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit">
                  <Sliders className="w-4 h-4 mr-1.5" />
                  Save Preferences
                </Button>
              </div>
            </form>

            {/* 1-Click Browser Job Clipper Bookmarklet Widget */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  1-Click Browser Job Clipper (Bookmarklet)
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag this button to your Bookmarks Bar (or right-click → bookmark). Whenever you visit a job posting on LinkedIn or Indeed, click the bookmarklet to clip it directly to JobTracker!
              </p>

              <div className="pt-1">
                <a
                  href={`javascript:(function(){var u=window.location.href;var t=document.title;var s=window.getSelection?window.getSelection().toString():'';var target='${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/board?clip_url='+encodeURIComponent(u)+'&clip_title='+encodeURIComponent(t)+'&clip_desc='+encodeURIComponent(s);window.open(target,'_blank');})();`}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Drag this button to your browser Bookmarks Bar!', 'info');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105"
                  title="Drag me to your Bookmarks toolbar!"
                >
                  <span>📥 Clip to JobTracker</span>
                </a>
              </div>
            </div>
          </div>
        )}


        {/* Tab 3: Data & Backups */}
        {activeTab === 'data' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Data Portability & Offline Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download a complete, offline copy of all your job applications, notes, interview rounds, offers, and linked resumes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Complete JSON Payload */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
                    <Database className="w-5 h-5" />
                    <span>Complete JSON Database Export</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Exports everything structured: all applications, interview history, notes timeline, compensation matrices, and resume metadata in standard JSON format.
                  </p>
                </div>

                <Button
                  onClick={handleExportJsonBackup}
                  isLoading={isExportingJson}
                  className="w-full justify-center bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <HardDriveDownload className="w-4 h-4 mr-1.5" />
                  Download JSON Backup
                </Button>
              </div>

              {/* Data Safety Info */}
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Data Privacy & Ownership</span>
                  </div>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                    Your job application data, resume versions, and compensation numbers are strictly private to your account. You can backup or export your complete history anytime.
                  </p>
                </div>

                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ GDPR & Data Portability Compliant
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
