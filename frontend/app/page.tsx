'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/Button';
import {
  Briefcase,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  Calendar,
  BarChart3,
  FileText,
  ArrowRight,
  CheckCircle2,
  Star,
  Layers,
  Award,
  TrendingUp,
  Brain,
  Sliders,
  Flame,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Top Marketing Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="tracking-tight">
              Job<span className="text-sky-400">Tracker</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#ai-suite" className="hover:text-white transition-colors">
              AI Copilot
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#scorecard" className="hover:text-white transition-colors">
              Analytics & CRM
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/board">
                <Button className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 text-xs sm:text-sm">
                  <span>Go to Board</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs sm:text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 text-xs sm:text-sm">
                    <span>Get Started Free</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        {/* Glow backdrop meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-indigo-500/15 blur-[100px] pointer-events-none rounded-full" />

        {/* Hero Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold mb-8 animate-in fade-in duration-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>The Next-Gen Career Operating System</span>
          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-[10px] text-sky-200">2.0</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6">
          Organize, Accelerate & Land Your Dream Job{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            With AI Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-400 max-w-3xl leading-relaxed mb-10">
          From 1-click job clipping and ATS resume scoring to AI STAR mock interview coaching and salary counter-offer negotiation. The complete all-in-one platform built for modern high-growth professionals.
        </p>

        {/* Hero CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          {user ? (
            <Link href="/board" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-sky-500/25 px-8 py-3.5 text-base">
                <span>Open Your Application Board</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-sky-500/25 px-8 py-3.5 text-base">
                  <span>Start Tracking Free</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-8 py-3.5 text-base">
                  <span>Sign In</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Live UI Mockup Preview Card */}
        <div className="w-full max-w-5xl rounded-2xl bg-slate-900/90 border border-slate-800 p-3 sm:p-5 shadow-2xl relative group">
          {/* Mock Browser Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                jobtracker.app/board
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full text-[11px]">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> 5-Day Streak Active
              </span>
              <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[11px] font-bold">
                Goal: 5/5 Achieved 🎉
              </span>
            </div>
          </div>

          {/* Mock Board Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Column 1: Applied */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Applied (8)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Stripe</h4>
                    <p className="text-[11px] text-slate-400">Full Stack Engineer</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                    Remote
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>ATS Match: <strong className="text-emerald-400">92%</strong></span>
                  <span>$140k - $170k</span>
                </div>
              </div>
            </div>

            {/* Column 2: Interviewing */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Interviewing (3)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2 ring-1 ring-amber-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Google</h4>
                    <p className="text-[11px] text-slate-400">Senior Software Engineer</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    Round 3
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="text-amber-300 font-medium">✨ STAR Prep Ready</span>
                  <span className="text-slate-300 font-bold">Tomorrow 2:00 PM</span>
                </div>
              </div>
            </div>

            {/* Column 3: Offers */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Offers (2)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 space-y-2 ring-1 ring-emerald-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Canva</h4>
                    <p className="text-[11px] text-slate-400">Staff Frontend Engineer</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    $165,000 USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="text-emerald-300 font-semibold">💰 AI Counter: +15%</span>
                  <span className="text-slate-300">Expires in 4d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-sky-400 uppercase">
            Everything You Need To Succeed
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            Engineered for high-performing job seekers
          </p>
          <p className="text-sm sm:text-base text-slate-400">
            A battle-tested workflow suite replacing messy spreadsheets, scattered notes, and missed interview callbacks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Kanban & Spreadsheet Views</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop applications across Applied, Interview, Offer, and Rejected stages. Toggle instantly to spreadsheet table mode with multi-column sorting and filtering.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Google Gemini AI Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tailor cover letters, generate recruiter cold emails, practice with STAR mock interview questions, and receive automated counter-offer compensation strategies.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Executive Pipeline Health</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time diagnostic score (0–100 & Grades A+ to Needs Push), conversion funnel metrics, stage velocity tracking, and exportable printable reports.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Recruiter & Contacts CRM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize hiring managers, recruiters, and referral contacts. Generate customized LinkedIn pitches and cold outreach messages in a single click.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interviews & Schedule Hub</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Centralized interview calendar with countdown timers, round preparation checklists, Google/iCal export, and automated follow-up reminders.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">1-Click Job Clipper & Auto-Fill</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clip job listings directly from LinkedIn, Indeed, and Greenhouse. AI Smart Paste extracts salary, work mode, and requirements in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Journey */}
      <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
            Proven Candidate Workflow
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            From Application to Signed Offer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 relative">
            <span className="text-4xl font-black text-slate-800">01</span>
            <h4 className="text-base font-bold text-white">Clip, Match & Apply</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save any job in 1-click. AI matches your PDF resume against job requirements to calculate ATS compatibility score before submitting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 relative">
            <span className="text-4xl font-black text-slate-800">02</span>
            <h4 className="text-base font-bold text-white">Practice & Close Rounds</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate tailored interview questions with the AI STAR coach. Track your interview stages with live velocity journey checkpoints.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 relative">
            <span className="text-4xl font-black text-slate-800">03</span>
            <h4 className="text-base font-bold text-white">Compare & Negotiate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare multiple multi-currency offers side-by-side. Use the AI negotiation advisor to generate polite counter-offer emails and phone scripts.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border border-sky-500/30 text-white shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Take Full Control of Your Job Search Today
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Join hundreds of developers and professionals landing top roles faster with automated intelligence and structured pipelines.
          </p>
          <div className="pt-2">
            <Link href={user ? '/board' : '/register'}>
              <Button size="lg" className="bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-bold px-8 py-3 text-base shadow-xl">
                <span>{user ? 'Go to Application Board' : 'Get Started for Free'}</span>
                <ArrowRight className="w-4 h-4 ml-2 text-slate-950" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-400">JobTracker OS</span>
            <span>• Built for Software Engineers & Tech Professionals</span>
          </div>
          <span>&copy; {new Date().getFullYear()} JobTracker. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
