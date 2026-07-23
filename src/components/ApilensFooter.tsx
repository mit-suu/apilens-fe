'use client';

import Link from 'next/link';

// ── Icon helpers ─────────────────────────────

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.39-3.9-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.78.12 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.07c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'New Scan', href: '/app' },
      { label: 'Scan History', href: '/app/history' },
      { label: 'Report Preview', href: '/#report' },
      { label: 'Workflow', href: '/#workflow' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'GitHub Access', href: 'https://github.com/settings/connections/applications', external: true },
      { label: 'REST Design Guide', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Open Source', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
];

const stats = [
  { value: '10K+', label: 'APIs analyzed' },
  { value: '98%', label: 'Accuracy rate' },
  { value: '<5s', label: 'Avg scan time' },
  { value: '50+', label: 'Smell patterns' },
];

// ── Component ────────────────────────────────

export default function ApilensFooter() {
  return (
    <footer
      className="relative overflow-hidden border-t border-white/[0.06]"
      style={{ background: 'linear-gradient(to bottom, #090d14 0%, #070b0a 100%)' }}
    >
      {/* Ambient glow top-left */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #5ed29c 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      {/* Ambient glow bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #7dd3fc 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 gap-px border-b border-white/[0.06] md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="py-8 pr-8">
              <p
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: '#5ed29c' }}
              >
                {value}
              </p>
              <p className="mt-1 text-sm text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Main footer body ── */}
        <div className="py-14 lg:grid lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:gap-12">

          {/* Brand column */}
          <div className="mb-12 lg:mb-0">
            {/* Logo */}
            <a href="/" className="inline-flex items-center gap-2 group">
              <span
                className="text-2xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                API<span style={{ color: '#5ed29c' }}>Lens</span>
              </span>
            </a>

            <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
              Detect REST design smells directly from your GitHub repository.
              Actionable quality reports in seconds, no configuration needed.
            </p>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                Stay updated
              </p>
              <div className="flex max-w-xs items-center gap-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]" suppressHydrationWarning>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                  aria-label="Email for newsletter"
                  suppressHydrationWarning
                  autoComplete="email"
                />
                <button
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:brightness-110"
                  style={{ background: '#5ed29c', color: '#070b0a' }}
                  aria-label="Subscribe to newsletter"
                >
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-white/25">
                No spam. Unsubscribe anytime.
              </p>
            </div>

            {/* Social links */}
            <div className="mt-8 flex items-center gap-3">
              {[
                { href: 'https://github.com', Icon: GithubIcon, label: 'GitHub' },
                { href: 'https://twitter.com', Icon: TwitterIcon, label: 'Twitter/X' },
                { href: 'https://linkedin.com', Icon: LinkedInIcon, label: 'LinkedIn' },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/40 transition hover:border-[#5ed29c]/40 hover:bg-[#5ed29c]/10 hover:text-[#5ed29c]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ heading, links }) => (
            <div key={heading}>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                {heading}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-white/35 transition-colors duration-150 hover:text-[#5ed29c]"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm text-white/35 transition-colors duration-150 hover:text-[#5ed29c]"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] py-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} APILens. Built for developers who care about API quality.
          </p>

          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-white/25 transition hover:text-white/50"
              >
                {item}
              </a>
            ))}
            {/* Status badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              All systems operational
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
