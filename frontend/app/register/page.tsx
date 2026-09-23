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
  UserCheck,
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
    <div className="-my-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Corporate Panel (Durdans Style Rich Gradient) */}
      <div className="w-full md:w-[45%] lg:w-[42%] bg-gradient-to-br from-[#025a8e] via-[#02759e] to-[#019688] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden shrink-0">
        {/* Subtle Ambient Background Circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo Card */}
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <div className="p-4 bg-white rounded-2xl shadow-xl w-24 h-24 flex flex-col items-center justify-center gap-1 group hover:scale-105 transition-transform">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold tracking-wider text-sky-900 uppercase">
                JobTracker
              </span>
            </div>
          </Link>
        </div>

        {/* Main Headline & Description */}
        <div className="my-12 sm:my-16 space-y-5 relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Accelerate Your Career,
            <br />
            <span className="text-sky-200">Simplified.</span>
          </h1>

          <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-md font-normal">
            Create your account to unlock AI-powered interview preparation, multi-currency offer negotiation, and automated application pipelines.
          </p>
        </div>

        {/* Bottom Legal Footer */}
        <div className="relative z-10 pt-6 text-xs text-sky-200/75 flex items-center gap-3 flex-wrap">
          <span>&copy; {new Date().getFullYear()} JobTracker</span>
          <span>•</span>
          <Link href="/" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/" className="hover:text-white transition-colors">
            Support
          </Link>
        </div>
      </div>

      {/* Right Form Section (Clean Minimalist Elevated Card) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800/80 p-8 sm:p-10 space-y-7">
          {/* Card Header with Mini Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm tracking-tight mb-1">
              <Briefcase className="w-4 h-4" />
              <span>JOBTRACKER SYSTEM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create Candidate Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get started with your free job search workspace
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. minothma@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#02629b] hover:bg-[#025080] text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Register to Portal</span>
                )}
              </button>
            </div>
          </form>

          {/* Account Login Switch */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Sign In to Portal
            </Link>
          </div>

          {/* Enterprise Security Micro-Badge */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
            <p className="text-[10px] tracking-wider font-semibold text-slate-400 dark:text-slate-500 uppercase leading-relaxed">
              PROTECTED BY ENTERPRISE-GRADE SECURITY.
              <br />
              AUTHORIZED ACCESS ONLY. UNAUTHORIZED ACCESS IS PROHIBITED.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
