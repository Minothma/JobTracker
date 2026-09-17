'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api-client';
import { Application } from '../lib/types';
import {
  Search,
  Briefcase,
  BarChart3,
  FileText,
  Plus,
  Download,
  Moon,
  Sun,
  Building2,
  ArrowRight,
  Sparkles,
  Command,
  X,
  Star,
  Brain,
} from 'lucide-react';
import { exportApplicationsToCsv } from '../lib/export-csv';
import { useToast } from './ui/Toast';

export const OPEN_COMMAND_PALETTE_EVENT = 'jobtracker_open_command_palette';

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
  }
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Applications' | 'Navigation' | 'Actions';
  icon: React.ReactNode;
  onSelect: () => void;
  badge?: string;
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, [isOpen]);

  // Fetch applications on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      apiFetch<Application[]>('/applications')
        .then((data) => setApplications(data || []))
        .catch(() => setApplications([]));
    }
  }, [isOpen]);

  // Toggle Theme helper
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      showToast('Switched to Light mode', 'info');
    } else {
      document.documentElement.classList.add('dark');
      showToast('Switched to Dark mode', 'info');
    }
  };

  // Build Command Items
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Navigation Pages
    list.push(
      {
        id: 'nav-board',
        title: 'Application Board',
        subtitle: 'Kanban pipeline & spreadsheet table',
        category: 'Navigation',
        icon: <Briefcase className="w-4 h-4 text-sky-500" />,
        onSelect: () => router.push('/board'),
      },
      {
        id: 'nav-analytics',
        title: 'Analytics & Insights',
        subtitle: 'Funnel conversion, velocity & offer comparison',
        category: 'Navigation',
        icon: <BarChart3 className="w-4 h-4 text-emerald-500" />,
        onSelect: () => router.push('/analytics'),
      },
      {
        id: 'nav-resumes',
        title: 'Resume Versions Vault',
        subtitle: 'Manage tailored PDF resumes with AWS S3',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-violet-500" />,
        onSelect: () => router.push('/resumes'),
      },
    );

    // 2. Quick Actions
    list.push(
      {
        id: 'act-ai-practice',
        title: 'AI Mock Interview Prep',
        subtitle: 'Generate realistic interview practice questions with model answers',
        category: 'Actions',
        icon: <Brain className="w-4 h-4 text-purple-500" />,
        onSelect: () => {
          if (applications.length > 0) {
            router.push(`/applications/${applications[0].id}`);
            showToast('Opening application for AI Mock Interview practice...', 'info');
          } else {
            router.push('/board');
            showToast('Create or select an application to start AI Interview practice', 'info');
          }
        },
      },
      {
        id: 'act-export-csv',
        title: 'Export Applications to CSV',
        subtitle: 'Download spreadsheet backup',
        category: 'Actions',
        icon: <Download className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          if (applications.length > 0) {
            exportApplicationsToCsv(applications);
            showToast(`Exported ${applications.length} applications to CSV`, 'success');
          } else {
            showToast('No applications to export', 'info');
          }
        },
      },
      {
        id: 'act-toggle-theme',
        title: 'Toggle Dark / Light Theme',
        subtitle: 'Switch application color palette',
        category: 'Actions',
        icon: <Moon className="w-4 h-4 text-indigo-500" />,
        onSelect: toggleTheme,
      },
    );

    // 3. Applications
    applications.forEach((app) => {
      list.push({
        id: `app-${app.id}`,
        title: app.company_name,
        subtitle: `${app.role_title}${app.location ? ` • ${app.location}` : ''}`,
        category: 'Applications',
        icon: app.is_favorite ? (
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        ) : (
          <Building2 className="w-4 h-4 text-slate-500" />
        ),
        badge: app.status,
        onSelect: () => router.push(`/applications/${app.id}`),
      });
    });

    return list;
  }, [applications, router, showToast]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // Keyboard Navigation inside modal
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        setIsOpen(false);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a company, role, page, or action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 flex-1 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No results found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => {
                    item.onSelect();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.badge === 'OFFER'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : item.badge === 'INTERVIEW'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : item.badge === 'REJECTED'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-sky-500" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Keyboard Hints */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono text-[10px]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="flex items-center gap-1 font-medium">
            <Command className="w-3 h-3" /> JobTracker
          </span>
        </div>
      </div>
    </div>
  );
};
