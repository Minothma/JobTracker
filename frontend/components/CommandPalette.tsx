'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api-client';
import { Application } from '../lib/types';
import {
  Search,
  Briefcase,
  Calendar,
  BarChart3,
  FileText,
  Download,
  Building2,
  ArrowRight,
  Sparkles,
  Command,
  X,
  Star,
  Brain,
  Sliders,
  Users,
} from 'lucide-react';
import { exportApplicationsToCsv } from '../lib/export-csv';
import { useToast } from './ui/Toast';
import { AiCoverLetterModal } from './AiCoverLetterModal';

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
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
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
        icon: <Briefcase className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/board'),
      },
      {
        id: 'nav-interviews',
        title: 'Interviews & Schedule Hub',
        subtitle: 'Upcoming rounds, calendar invites & countdown timers',
        category: 'Navigation',
        icon: <Calendar className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/interviews'),
      },
      {
        id: 'nav-contacts',
        title: 'Recruiter & Contacts Directory',
        subtitle: 'Manage recruiters, hiring managers, and instant outreach drafts',
        category: 'Navigation',
        icon: <Users className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/contacts'),
      },
      {
        id: 'nav-analytics',
        title: 'Analytics & Insights',
        subtitle: 'Funnel conversion, velocity & offer comparison',
        category: 'Navigation',
        icon: <BarChart3 className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/analytics'),
      },
      {
        id: 'nav-resumes',
        title: 'Resume Versions Vault',
        subtitle: 'Manage tailored PDF resumes with AWS S3',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/resumes'),
      },
      {
        id: 'nav-settings',
        title: 'Account Settings & Preferences',
        subtitle: 'Manage credentials, default currency, and full JSON data backup',
        category: 'Navigation',
        icon: <Sliders className="w-4 h-4 text-zinc-400" />,
        onSelect: () => router.push('/settings'),
      },
    );

    // 2. Quick Actions
    list.push(
      {
        id: 'act-ai-cover-letter',
        title: 'Generate Cover Letter / InMail Pitch',
        subtitle: 'Create tailored application letters and LinkedIn recruiter pitches with AI',
        category: 'Actions',
        icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
        onSelect: () => setIsCoverLetterOpen(true),
      },
      {
        id: 'act-ai-practice',
        title: 'Mock Interview Practice',
        subtitle: 'Generate interview practice questions with STAR evaluation frameworks',
        category: 'Actions',
        icon: <Brain className="w-4 h-4 text-indigo-400" />,
        onSelect: () => {
          if (applications.length > 0) {
            router.push(`/applications/${applications[0].id}`);
            showToast('Opening application for interview practice...', 'info');
          } else {
            router.push('/board');
            showToast('Select an application to start interview practice', 'info');
          }
        },
      },
      {
        id: 'act-export-csv',
        title: 'Export Applications to CSV',
        subtitle: 'Download complete spreadsheet backup',
        category: 'Actions',
        icon: <Download className="w-4 h-4 text-zinc-400" />,
        onSelect: () => {
          if (applications.length > 0) {
            exportApplicationsToCsv(applications);
            showToast(`Exported ${applications.length} applications to CSV`, 'success');
          } else {
            showToast('No applications to export', 'info');
          }
        },
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
          <Building2 className="w-4 h-4 text-zinc-400" />
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#27272A] gap-2.5">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, or application..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono text-zinc-500 bg-[#18181B] rounded border border-[#27272A]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-1.5 flex-1 space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">
              No results found for &ldquo;<span className="font-mono text-zinc-400">{query}</span>&rdquo;
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
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#18181B] text-zinc-100'
                      : 'text-zinc-400 hover:bg-[#18181B]/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-[#18181B] border border-[#27272A] shrink-0 text-zinc-300">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-zinc-500 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                          item.badge === 'OFFER'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : item.badge === 'INTERVIEW'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                            : item.badge === 'REJECTED'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                            : 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Keyboard Hints */}
        <div className="px-3.5 py-2 bg-[#0E0E10] border-t border-[#27272A] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.2 bg-[#18181B] border border-[#27272A] rounded text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1 py-0.2 bg-[#18181B] border border-[#27272A] rounded text-[10px]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.2 bg-[#18181B] border border-[#27272A] rounded text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> JobTracker
          </span>
        </div>
      </div>

      {/* AI Cover Letter Generator Modal */}
      <AiCoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
      />
    </div>
  );
};
