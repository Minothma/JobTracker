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
  Zap,
  ArrowRight,
  Brain,
  Layers,
  Award,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
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
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sign in to your account to continue managing your job search pipeline.
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-bold text-sky-600 hover:underline dark:text-sky-400">
              Create free account
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Showcase Banner */}
        <div className="hidden lg:flex lg:col-span-6 p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-950 text-white flex-col justify-between relative overflow-hidden border-l border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/20 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 blur-[90px] rounded-full pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-sky-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI-Powered Career OS</span>
            </div>

            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              Land high-impact engineering roles with structured intelligence.
            </h2>

            {/* Feature Pills */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">AI STAR Interview Coach</p>
                  <p className="text-slate-400 text-[11px]">Generate tailored behavioral & technical practice rounds</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Executive Pipeline Health</p>
                  <p className="text-slate-400 text-[11px]">Conversion metrics & printable diagnostic scorecard</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">1-Click Job Clipper & Auto-Fill</p>
                  <p className="text-slate-400 text-[11px]">Instant metadata parsing from LinkedIn & job boards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="pt-6 border-t border-white/10 text-xs text-slate-300 space-y-1 relative z-10">
            <p className="italic">
              &ldquo;The AI interview grader and salary counter-strategy advisor helped me negotiate a $165k offer seamlessly.&rdquo;
            </p>
            <p className="font-bold text-white text-[11px]">
              — Software Engineer at Canva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
