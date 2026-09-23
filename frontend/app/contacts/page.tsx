'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api-client';
import { Application } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AiEmailGeneratorModal } from '../../components/AiEmailGeneratorModal';
import {
  Users,
  Search,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Briefcase,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface ExtractedContact {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  companyName: string;
  roleTitle: string;
  status: string;
}

export default function ContactsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Email Modal state
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    companyName: string;
    roleTitle: string;
    recipientName?: string;
  }>({
    isOpen: false,
    companyName: '',
    roleTitle: '',
    recipientName: '',
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Application[]>('/applications');
      setApplications(data || []);
    } catch {
      showToast('Failed to load contacts directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Extract all non-empty contacts from applications
  const contacts: ExtractedContact[] = useMemo(() => {
    const list: ExtractedContact[] = [];

    applications.forEach((app) => {
      if (app.contact_name || app.contact_email) {
        list.push({
          id: `contact-${app.id}`,
          applicationId: app.id,
          name: app.contact_name || 'Hiring Team / Recruiter',
          email: app.contact_email || '',
          companyName: app.company_name,
          roleTitle: app.role_title,
          status: app.status,
        });
      }
    });

    return list;
  }, [applications]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.roleTitle.toLowerCase().includes(q),
    );
  }, [contacts, searchQuery]);

  const handleCopyEmail = (email: string, id: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedKey(id);
    showToast(`Copied ${email} to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchAiEmail = (contact: ExtractedContact) => {
    setEmailModalData({
      isOpen: true,
      companyName: contact.companyName,
      roleTitle: contact.roleTitle,
      recipientName: contact.name !== 'Hiring Team / Recruiter' ? contact.name : undefined,
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner - Linear Developer Aesthetics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg bg-[#121214] border border-[#27272A] text-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#FAFAFA]">
              Recruiter & Professional Network CRM
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Keep your network organized. Access hiring managers, recruiters, and referral contacts with 1-click AI outreach email generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0A0A0B] border border-[#27272A] text-xs">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
              Contacts
            </span>
            <span className="font-mono font-semibold text-zinc-100">{contacts.length}</span>
          </div>

          <Link href="/board">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Applications</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Refresh Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-[#121214] p-3 rounded-lg border border-[#27272A]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact name, company, email or role..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[#0A0A0B] border border-[#27272A] text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>

        <button
          onClick={fetchApplications}
          disabled={loading}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B] border border-[#27272A] transition-colors"
          title="Refresh contacts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading recruiter network...</p>
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col justify-between p-4 rounded-lg bg-[#121214] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header: Avatar & Name */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A] flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                    {getInitials(contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-[#FAFAFA] truncate">
                      {contact.name}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium truncate">
                      {contact.companyName}
                    </p>
                  </div>
                </div>

                {/* Role & Application Reference */}
                <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#27272A] space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-200 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{contact.roleTitle}</span>
                  </div>

                  {contact.email ? (
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-zinc-300 hover:text-indigo-400 hover:underline truncate flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(contact.email, contact.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-100"
                        title="Copy email address"
                      >
                        {copiedKey === contact.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 italic">No email on file</div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-[#27272A] flex items-center justify-between gap-2">
                <Link
                  href={`/applications/${contact.applicationId}`}
                  className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors font-mono"
                >
                  <span>Application</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLaunchAiEmail(contact)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  <span>AI Email</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-lg bg-[#121214] border border-[#27272A] text-center space-y-4">
          <div className="w-10 h-10 rounded-md bg-[#18181B] text-zinc-300 mx-auto flex items-center justify-center border border-[#27272A]">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#FAFAFA]">
              {searchQuery ? 'No matching contacts found' : 'No recruiter contacts recorded yet'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Add contact names and emails when creating or editing applications to build your centralized networking directory.
            </p>
          </div>

          <Link href="/board">
            <Button variant="secondary" size="sm" className="text-xs">
              <Briefcase className="w-3.5 h-3.5 mr-1" />
              <span>Go to Applications Board</span>
            </Button>
          </Link>
        </div>
      )}

      {/* AI Email Generator Modal */}
      <AiEmailGeneratorModal
        isOpen={emailModalData.isOpen}
        onClose={() => setEmailModalData((prev) => ({ ...prev, isOpen: false }))}
        companyName={emailModalData.companyName}
        roleTitle={emailModalData.roleTitle}
        initialType="COLD_OUTREACH"
        initialRecipientName={emailModalData.recipientName}
      />
    </div>
  );
}
