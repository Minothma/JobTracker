'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import {
  Briefcase,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Zap,
  FolderLock,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="-my-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#0A0A0B] text-[#FAFAFA] font-sans">
      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden bg-[#121214] border border-[#27272A] shadow-2xl">
        
        {/* Left Side: Developer-first Product Highlights (55% width) */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#27272A] bg-[#0E0E10]">
          <div>
            {/* Top Brand Header */}
            <Link href="/" className="inline-flex items-center gap-3 group mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#5E6AD2] flex items-center justify-center text-white text-xs font-mono font-bold">
                JT
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[#FAFAFA] tracking-tight">
                  JobTracker
                </span>
                <span className="text-[11px] text-[#71717A] font-mono tracking-tight">
                  Personal Career OS
                </span>
              </div>
            </Link>

            {/* Headline & Subtitle */}
            <div className="space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] text-[#A1A1AA] text-xs font-mono">
                <Terminal className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Zero Cost • Self-Serve</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#FAFAFA] tracking-tight leading-snug">
                Start tracking your search systematically.
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-md">
                Create a free account to track applications, practice STAR questions with AI, and analyze offer packages.
              </p>
            </div>

            {/* What you get checklist */}
            <div className="space-y-2.5 bg-[#121214] p-4 rounded-lg border border-[#27272A] mb-6">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5E6AD2] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-[#FAFAFA]">Kanban & Table Views</p>
                  <p className="text-[#71717A] text-[11px]">Track stages, deadlines, velocity metrics, and priority flags</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5E6AD2] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-[#FAFAFA]">AI Career Tooling Suite</p>
                  <p className="text-[#71717A] text-[11px]">STAR interview practice, ATS keyword scoring, cover letters, and counter-offers</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5E6AD2] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-[#FAFAFA]">Recruiter CRM & Resume Vault</p>
                  <p className="text-[#71717A] text-[11px]">1-click cold outreach generator and tailored versioned PDF resumes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="pt-6 border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A] font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Free Forever • No Credit Card Required
            </span>
            <span>&copy; {new Date().getFullYear()} JobTracker</span>
          </div>
        </div>

        {/* Right Side: Registration Form (45% width) */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col items-center justify-center bg-[#121214] min-h-full">
          <div className="w-full max-w-sm space-y-6 my-auto">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Set up your personal workspace in seconds.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-rose-950/30 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D4D4D8]">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D4D4D8]">
                  Password (min 8 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D4D4D8]">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#0A0A0B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-md bg-[#5E6AD2] hover:bg-[#6875E3] text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Switch to Login */}
            <div className="pt-4 border-t border-[#27272A] text-center text-xs text-[#A1A1AA]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
