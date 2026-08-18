'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { getCurrentUser } from '@/libs/api';
import { type AuthUser } from '@/types/global';
import Link from 'next/link';
import {
  Download,
  Sparkles,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Layers,
  ArrowRight,
  FileCode,
} from 'lucide-react';

export default function VSCodeExtensionPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading ApiLens Extension Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white selection:bg-indigo-500 selection:text-white">
      {user && <AppHeader user={user} activeTab="vscode" />}

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 md:p-12 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 border border-indigo-500/30 text-xs font-bold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>DEVELOPER ECOSYSTEM • VS CODE INTEGRATION</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              ApiLens for <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">VS Code Extension</span>
            </h1>

            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Analyze REST API design smells, check specification compliance, and refactor code using AI directly inside your editor. Zero context switching, instant inline linting, and 1-click QuickFix.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="/downloads/apilens-vscode-0.0.1.vsix"
                download="apilens-vscode-0.0.1.vsix"
                className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:opacity-95 transition-all border border-indigo-400/30"
              >
                <Download className="h-5 w-5" />
                <span>Download Extension (.VSIX)</span>
              </a>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 hover:bg-gray-700 px-5 py-3.5 text-sm font-semibold text-gray-200 transition-all"
              >
                <span>Back to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Compatible with VS Code v1.90+
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Free & Offline-Ready Local Support
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid (4 Pillars) */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Powerful IDE Capabilities</h2>
            <p className="text-xs text-gray-400 max-w-xl mx-auto">
              Everything you need to write clean, RESTful, and maintainable API endpoints directly in your favorite code editor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">1-Click AI QuickFix</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hover over any yellow/red API smell warning, press <code className="text-amber-300">Ctrl + .</code> and select AI QuickFix to automatically refactor your endpoint.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Inline Diagnostics</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Get immediate visual squiggly error underlines and Problems panel warnings whenever an endpoint violates REST design standards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Rich Webview Reports</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Render animated SVG score rings, severity breakdowns, and detailed rule suggestions in a side-by-side interactive Webview tab.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileCode className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Format Scanner</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Scan workspace API definitions seamlessly across Express routes (`.routes.js`), OpenAPI/Swagger (`.yaml`/`.json`), and Postman Collections.
              </p>
            </div>
          </div>
        </section>

        {/* Installation Guide */}
        <section className="rounded-2xl border border-gray-800 bg-[#121827] p-8 shadow-xl space-y-8">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Easy Installation Guide</h2>
              <p className="text-xs text-gray-400">Follow these 3 quick steps to install and activate ApiLens in VS Code</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="space-y-3 rounded-xl bg-[#0b0f19] p-5 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 1</span>
                <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center">1</span>
              </div>
              <h3 className="text-sm font-bold text-white">Download VSIX Package</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Click the button above to download the <code className="text-indigo-300">apilens-vscode-0.0.1.vsix</code> extension file to your local computer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 rounded-xl bg-[#0b0f19] p-5 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 2</span>
                <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center">2</span>
              </div>
              <h3 className="text-sm font-bold text-white">Install in VS Code</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Open VS Code ➔ Extensions tab (<code className="text-indigo-300">Ctrl+Shift+X</code>) ➔ Click <code className="text-indigo-300">...</code> menu ➔ Select <strong>Install from VSIX...</strong>
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 rounded-xl bg-[#0b0f19] p-5 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step 3</span>
                <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center">3</span>
              </div>
              <h3 className="text-sm font-bold text-white">Run Analysis & AI Fix</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Open any API route file ➔ Press <code className="text-indigo-300">Ctrl + Shift + P</code> ➔ Select <strong>ApiLens: Analyze Current File</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
