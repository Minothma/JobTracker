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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  Zap,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="-my-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-slate-800 shadow-[0_0_60px_-15px_rgba(14,165,233,0.15)] relative z-10">
        
        {/* Left Side: Interactive Career OS Visual Showcase (55% width) */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/40">
          <div>
            {/* Top Brand Header */}
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-8">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Job<span className="text-sky-400">Tracker</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono -mt-1 tracking-wider uppercase">
                  Enterprise AI Platform
                </span>
              </div>
            </Link>

            {/* Headline & Subtitle */}
            <div className="space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Next-Gen Career Copilot</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                The AI-Powered Operating System for Your Career.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Manage recruitment pipelines, practice with AI STAR mock interview coaches, and negotiate top compensation packages with data-driven leverage.
              </p>
            </div>

            {/* Floating Superpower Live Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {/* Card 1: AI STAR Prep */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1.5 hover:border-sky-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Brain className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    94% Fit
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">AI STAR Interview Coach</h4>
                <p className="text-[11px] text-slate-400">Instant answer grading & sample frameworks</p>
              </div>

              {/* Card 2: Executive Scorecard */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80">
                    Grade A+
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Pipeline Health Scorecard</h4>
                <p className="text-[11px] text-slate-400">Conversion funnels & printable analytics</p>
              </div>

              {/* Card 3: Salary Negotiation Advisor */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1.5 hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                    +15% Counter
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Salary Negotiation Advisor</h4>
                <p className="text-[11px] text-slate-400">Phone scripts & counter-offer emails</p>
              </div>

              {/* Card 4: 1-Click Clipper & Streaks */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-1.5 hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80">
                    5-Day Streak
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">1-Click Clipper & CRM</h4>
                <p className="text-[11px] text-slate-400">Instant job parse & recruiter tracking</p>
              </div>
            </div>
          </div>

          {/* Left Footer Trust Markers */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Free & Open-Source
            </span>
            <span>&copy; {new Date().getFullYear()} JobTracker OS</span>
          </div>
        </div>

        {/* Right Side: Sleek Authentication Form (45% width) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-slate-900/40">
          <div>
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-400">
                Sign in to your account to access your applications pipeline.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/register"
                    className="text-xs font-semibold text-sky-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:via-indigo-400 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Switch to Register */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-sky-400 hover:text-sky-300 hover:underline"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
