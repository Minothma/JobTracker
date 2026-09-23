import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/ui/Toast';
import { Navbar } from '../components/Navbar';
import { CommandPalette } from '../components/CommandPalette';

export const metadata: Metadata = {
  title: 'JobTracker — Personal Career Operating System',
  description: 'Open-source personal career copilot with Kanban job tracking, AI mock interviews, and salary negotiation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0A0A0B] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <CommandPalette />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
