import TTSForm from '@/components/TTSForm';
import ThemeToggle from '@/components/ThemeToggle';
import { Mic2, Radio, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation / Brand Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-[#0e0e0e]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-sm">
              <Mic2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold tracking-tight text-lg text-neutral-950 dark:text-white">
                SPEAKWELL
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-[#181818] text-neutral-600 dark:text-neutral-400">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                Edge TTS Neural
              </span>
            </div>
          </div>

          {/* Right Header Badges & Theme Toggle */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-[#141414]">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>In-Memory Buffer</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TTSForm />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-[#0e0e0e]/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <div>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">SPEAKWELL</span> — High-performance Text-to-Speech studio powered by Microsoft Edge TTS.
          </div>
          <div>
            Zero serverless filesystem I/O • 300+ Neural Voices • Vercel Ready
          </div>
        </div>
      </footer>
    </div>
  );
}
