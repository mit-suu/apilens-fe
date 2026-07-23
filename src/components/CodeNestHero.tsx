'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const HLS_SRC =
  'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8';

// ── Props ─────────────────────────────────────

interface HeroProps {
  /** URL cho nút CTA chính (dashboard hoặc GitHub OAuth) */
  primaryHref: string;
  /** Label nút CTA chính */
  primaryLabel: string;
  /** true nếu user đã đăng nhập */
  isAuthenticated: boolean;
}

// ── Sub-components ────────────────────────────

function GithubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.39-3.9-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.78.12 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.07c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

/** Thin vertical grid lines at 25 / 50 / 75 % */
function GridLines() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      {[25, 50, 75].map((pct) => (
        <div
          key={pct}
          className="absolute top-0 h-full w-px bg-white/10"
          style={{ left: `${pct}%` }}
        />
      ))}
    </div>
  );
}

/** SVG cyan/dark-green ellipse glow */
function CentralGlow() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden" aria-hidden="true">
      <svg width="900" height="300" viewBox="0 0 900 300" fill="none" className="mt-[-60px]">
        <defs>
          <filter id="ap-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" result="blur" />
          </filter>
          <linearGradient id="ap-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00b4a6" />
            <stop offset="50%" stopColor="#5ed29c" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
        <ellipse cx="450" cy="150" rx="380" ry="100" fill="url(#ap-grad)" filter="url(#ap-glow)" opacity="0.5" />
      </svg>
    </div>
  );
}

/** Liquid Glass Card – APILens-themed */
function LiquidGlassCard() {
  return (
    <div className="cn-glass-card" aria-label="APILens highlight card">
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        {/* Tag */}
        <span
          className="inline-block w-fit rounded-full border border-white/20 px-2.5 py-0.5 text-white/60"
          style={{ fontSize: '14px' }}
        >
          [ v2025 ]
        </span>

        {/* Content */}
        <div>
          <p className="leading-snug text-white" style={{ fontSize: '18px' }}>
            Detect{' '}
            <em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: '#5ed29c' }}>
              REST design
            </em>{' '}
            smells instantly
          </p>
          <p className="mt-2 text-white/50" style={{ fontSize: '11px', lineHeight: '1.5' }}>
            Scans GitHub repositories and returns a scored, actionable quality
            report in seconds. No configuration needed.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────

export default function ApiLensHero({ primaryHref, primaryLabel, isAuthenticated }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* HLS video setup */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hlsInstance: import('hls.js').default | null = null;

    async function initHls() {
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: false });
        hlsInstance.loadSource(HLS_SRC);
        hlsInstance.attachMedia(video!);
      } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
        video!.src = HLS_SRC;
      }
    }

    initHls();
    return () => { hlsInstance?.destroy(); };
  }, []);

  /* Close mobile menu on desktop resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Report',   href: '#report'   },
  ];

  return (
    <>
      {/* ══════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════ */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12">
        {/* Logo */}
        <a
          href="/"
          className="text-2xl font-extrabold tracking-tight text-white"
          style={{ fontFamily: "'Inter', sans-serif" }}
          aria-label="APILens home"
        >
          APILens
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-white/70 transition-colors duration-200 hover:text-[#5ed29c]"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px' }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href={primaryHref}
          className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/40 lg:inline-flex"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {!isAuthenticated && <GithubIcon />}
          <span>{isAuthenticated ? 'Dashboard' : 'Continue'}</span>
        </a>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile full-screen overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[#070b0a]/95 backdrop-blur-xl lg:hidden">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-bold text-white/80 transition hover:text-[#5ed29c]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {label}
            </a>
          ))}
          <a
            href={primaryHref}
            onClick={() => setMenuOpen(false)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5ed29c] px-6 py-3 text-sm font-bold text-[#070b0a]"
          >
            {!isAuthenticated && <GithubIcon />}
            {primaryLabel}
          </a>
        </div>
      )}

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex min-h-screen w-full items-center overflow-hidden"
        style={{ background: '#070b0a' }}
      >
        {/* Background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.6 }}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />

        {/* Left dark gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to right, #070b0a 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        {/* Bottom-up gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to top, #070b0a 0%, rgba(7,11,10,0.5) 30%, transparent 60%)' }}
          aria-hidden="true"
        />

        <GridLines />
        <CentralGlow />

        {/* Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-32 lg:px-12 lg:pt-40">

          {/* Liquid Glass Card – shifted 50px up */}
          <div className="-translate-y-[50px]">
            <LiquidGlassCard />
          </div>

          {/* Eyebrow */}
          <p
            className="mb-4 font-bold uppercase tracking-widest"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '11px',
              color: '#5ed29c',
              letterSpacing: '0.18em',
            }}
          >
            GitHub-native API governance
          </p>

          {/* Main headline */}
          <h1
            className="font-extrabold uppercase leading-none tracking-tight"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(36px, 6.5vw, 72px)',
            }}
          >
            FIND REST DESIGN ISSUES
            <br />
            BEFORE THEY SHIP
            <span style={{ color: '#5ed29c' }}>.</span>
          </h1>

          {/* Description */}
          <p
            className="mt-6 text-white/70"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              lineHeight: '1.75',
              maxWidth: '512px',
            }}
          >
            APILens scans repository files, detects design smells, and turns
            static API structure into a readable quality report for teams.
            No credit card. Supports public and private repositories.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={primaryHref}
              id="apilens-hero-cta"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(94,210,156,0.4)]"
              style={{ background: '#5ed29c', color: '#070b0a', fontFamily: "'Inter', sans-serif" }}
            >
              {!isAuthenticated && <GithubIcon />}
              {primaryLabel}
              <ArrowRight size={16} strokeWidth={2.5} />
            </a>
            <a
              href="#overview"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white transition duration-200 hover:bg-white/10"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
