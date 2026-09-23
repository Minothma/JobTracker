'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Briefcase,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Flame,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Left Side: Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Top Brand Link */}
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-base text-sky-600 dark:text-sky-400 mb-8">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-slate-900 dark:text-white">
                Job<span className="text-sky-500">Tracker</span>
              </span>
            </Link>

            <div className="space-y-2 mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Join in seconds to track, manage, and ace your job search.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/70 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                helperText="Minimum 8 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20"
                isLoading={isLoading}
              >
                Create Free Account
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-sky-600 hover:underline dark:text-sky-400">
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Showcase Banner */}
        <div className="hidden lg:flex lg:col-span-6 p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex-col justify-between relative overflow-hidden border-l border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/20 blur-[90px] rounded-full pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-purple-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>100% Free Career OS</span>
            </div>

            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              Transform your job hunt from chaos into a streamlined machine.
            </h2>

            {/* Checklist of What You Get */}
            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>AI Cover Letter & LinkedIn Pitch Generator:</strong> Create tailored recruiter pitches in seconds.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Interactive Kanban Board & Spreadsheets:</strong> Track applications with live stage velocity.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>AI Mock Interview Coach:</strong> Practice with STAR frameworks and instant scoring.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Recruiter CRM & S3 Resume Vault:</strong> Keep contacts and versions organized in one place.</span>
              </div>
            </div>
          </div>

          {/* Social Proof Badge */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Free & Open Source
            </span>
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
