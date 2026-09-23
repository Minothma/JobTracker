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
  LogOut,
  Bell,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Users,
  Sliders,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { openCommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<StaleApplication[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  const handleManualScan = async () => {
    try {
      setIsScanning(true);
      const res = await apiFetch<NotificationCheckResult>('/notifications/trigger', {
        method: 'POST',
      });
      setAlerts(res.alerts || []);
      showToast(
        `Scan complete. ${res.stale_count} applications require follow-up`,
        'success',
      );
    } catch {
      showToast('Failed to trigger scan', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  if (!user) return null;

  const navLinks = [
    { href: '/board', label: 'Applications', icon: <Briefcase className="w-3.5 h-3.5" />, active: pathname === '/board' || pathname.startsWith('/applications') },
    { href: '/interviews', label: 'Interviews', icon: <Calendar className="w-3.5 h-3.5" />, active: pathname === '/interviews' },
    { href: '/contacts', label: 'Contacts', icon: <Users className="w-3.5 h-3.5" />, active: pathname === '/contacts' },
    { href: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" />, active: pathname === '/analytics' },
    { href: '/resumes', label: 'Resumes', icon: <FileText className="w-3.5 h-3.5" />, active: pathname === '/resumes' },
    { href: '/settings', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" />, active: pathname === '/settings' },
  ];

  return (
    <header className="border-b border-[#27272A] bg-[#0A0A0B]/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6">
          <Link href="/board" className="flex items-center gap-2 font-bold text-sm text-zinc-100 tracking-tight">
            <div className="p-1 rounded-md bg-indigo-600 text-white">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <span>JobTracker</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  link.active
                    ? 'bg-[#18181B] text-zinc-100 border border-[#27272A]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121214]'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Center/Right: Quick Search Command Trigger */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs text-zinc-400 bg-[#121214] hover:bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-md transition-colors cursor-pointer"
          title="Search applications or jump to pages (Ctrl+K)"
        >
          <Search className="w-3 h-3 text-zinc-500" />
          <span>Search applications...</span>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-[#18181B] rounded border border-[#27272A] text-zinc-400">
            ⌘K
          </kbd>
        </button>

        {/* User profile, Notifications & logout */}
        <div className="flex items-center gap-2">
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#121214] border border-transparent hover:border-[#27272A] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-[#0A0A0B]" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#121214] rounded-xl shadow-2xl border border-[#27272A] py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 pb-2.5 border-b border-[#27272A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">
                      Follow-up Alerts
                    </span>
                    {alerts.length > 0 && (
                      <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold px-1.5 py-0.2 rounded">
                        {alerts.length}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleManualScan}
                    disabled={isScanning}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    title="Run fresh scan"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Scan</span>
                  </button>
                </div>

                {/* Alerts List */}
                <div className="max-h-72 overflow-y-auto px-2 py-1.5 divide-y divide-[#27272A]/50">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/applications/${alert.id}`}
                        onClick={() => setIsNotifOpen(false)}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-[#18181B] transition-colors group block"
                      >
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-zinc-200 group-hover:text-indigo-400">
                              {alert.company_name}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                              {alert.role_title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-amber-400 font-medium bg-amber-950/40 border border-amber-800/40 px-1 py-0.2 rounded">
                            {alert.days_waiting}d
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center text-zinc-500 flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <p className="text-xs font-medium text-zinc-300">
                        All caught up
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        No stale applications waiting for follow-up
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-3.5 pt-2 border-t border-[#27272A] text-[10px] text-zinc-500 flex items-center justify-between">
                  <span>Daily scan at 9:00 AM</span>
                  <Link
                    href="/analytics"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-indigo-400 hover:underline"
                  >
                    View Analytics
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#27272A]">
            <span className="text-xs font-mono text-zinc-400 max-w-[150px] truncate" title={user.email}>
              {user.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-zinc-400 hover:text-rose-400 p-1.5"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
