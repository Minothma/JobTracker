'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiFetch } from '../lib/api-client';
import { StaleApplication, NotificationAlertsResponse, NotificationCheckResult } from '../lib/types';
import {
  Briefcase,
  Calendar,
  FileText,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  Bell,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Users,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { openCommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<StaleApplication[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const res = await apiFetch<NotificationAlertsResponse>('/notifications/alerts');
      setAlerts(res.alerts || []);
    } catch {
      // Gracefully ignore background alert fetch error
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleManualScan = async () => {
    try {
      setIsScanning(true);
      const res = await apiFetch<NotificationCheckResult>('/notifications/trigger', {
        method: 'POST',
      });
      setAlerts(res.alerts || []);
      showToast(
        `Scan complete! Found ${res.stale_count} applications requiring follow-up (${res.dispatched_via})`,
        'success',
      );
    } catch {
      showToast('Failed to trigger scan', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  if (!user) return null;

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/board" className="flex items-center gap-2.5 font-bold text-lg text-sky-600 dark:text-sky-400">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <span>JobTracker</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/board"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/board' || pathname.startsWith('/applications')
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Applications</span>
            </Link>

            <Link
              href="/interviews"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/interviews'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Interviews</span>
            </Link>

            <Link
              href="/contacts"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/contacts'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Contacts</span>
            </Link>

            <Link
              href="/analytics"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/analytics'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>

            <Link
              href="/resumes"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/resumes'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Resumes</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Settings</span>
            </Link>
          </nav>
        </div>


        {/* Center/Right: Quick Search Command Trigger */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          title="Search applications or jump to pages (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search applications...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* User profile, Notifications, theme toggle & logout */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Notifications
                    </span>
                    {alerts.length > 0 && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                        {alerts.length} action{alerts.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleManualScan}
                    disabled={isScanning}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    title="Run fresh stale applications scan"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Scan Now</span>
                  </button>
                </div>

                {/* Alerts List */}
                <div className="max-h-72 overflow-y-auto px-2 py-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/applications/${alert.id}`}
                        onClick={() => setIsNotifOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group block"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                              {alert.company_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {alert.role_title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded text-[11px]">
                            {alert.days_waiting}d
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        All caught up!
                      </p>
                      <p className="text-[11px] text-slate-400">
                        No stale applications waiting for follow-up
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Daily automated scan at 9:00 AM</span>
                  <Link
                    href="/analytics"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    View Analytics
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={user.email}>
              {user.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

