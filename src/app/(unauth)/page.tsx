import ApilensFooter from '@/components/ApilensFooter';
import ApiLensHero from '@/components/CodeNestHero';
import MotionScope from '@/components/MotionScope';
import TiltCard from '@/components/TiltCard';
import { getBackendAuthUrl } from '@/libs/env';
import { getServerCurrentUser } from '@/libs/server-auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'APILens - Quality reports for REST APIs',
  description:
    'Detect REST design smells directly from your GitHub repository in seconds.',
  openGraph: { type: 'website', locale: 'en_US' },
};

// ── Workflow steps ────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Connect GitHub',
    description:
      'Authorize once and keep analysis scoped to your repositories. Private repos fully supported.',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.39-3.9-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.78.12 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.07c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    ),
    accent: '#5ed29c',
    glow: 'rgba(94,210,156,0.15)',
    glowCard: 'rgba(94,210,156,0.09)',
    tag: 'Authorization',
  },
  {
    number: '02',
    title: 'Choose source',
    description:
      'Pick a repo, branch, and the API file APILens should inspect. OpenAPI & Swagger supported.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    accent: '#7dd3fc',
    glow: 'rgba(125,211,252,0.15)',
    glowCard: 'rgba(125,211,252,0.09)',
    tag: 'Configuration',
  },
  {
    number: '03',
    title: 'Review fixes',
    description:
      'Get a scored report with endpoint-level smells and prioritized remediation suggestions.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    glowCard: 'rgba(167,139,250,0.09)',
    tag: 'Remediation',
  },
];

// ── Signal cards ──────────────────────────────────────────────────────────────

const signals = [
  {
    label: 'Design smells',
    value: '8',
    detail: 'Verb-based URLs, missing versioning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accent: '#fb7185',
    bg: 'rgba(251,113,133,0.07)',
    border: 'rgba(251,113,133,0.18)',
  },
  {
    label: 'Endpoints',
    value: '17',
    detail: 'Express routes and OpenAPI operations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    accent: '#7dd3fc',
    bg: 'rgba(125,211,252,0.07)',
    border: 'rgba(125,211,252,0.18)',
  },
  {
    label: 'Suggested fixes',
    value: '4',
    detail: 'Prioritized remediation notes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    accent: '#5ed29c',
    bg: 'rgba(94,210,156,0.07)',
    border: 'rgba(94,210,156,0.18)',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const user = await getServerCurrentUser();
  const githubAuthUrl = getBackendAuthUrl('/auth/github');
  const primaryHref = user ? '/dashboard' : githubAuthUrl;
  const primaryLabel = user ? 'Open dashboard' : 'Continue with GitHub';

  return (
    <div className="app-shell overflow-hidden">

      {/* Hero */}
      <ApiLensHero
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        isAuthenticated={!!user}
      />

      <MotionScope>

        {/* ════════════════════════════════════════════════
            WORKFLOW
        ════════════════════════════════════════════════ */}
        <section id="workflow" className="relative mx-auto max-w-6xl px-5 py-20 lg:py-28">

          <div className="motion-item mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">Workflow</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Three steps from repo to report
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              The interface progressively reveals decisions, keeping the scan
              flow focused and easy to recover from.
            </p>
          </div>

          <div className="relative grid gap-4 md:grid-cols-3">
            {/* Connector gradient line (desktop) */}
            <div
              className="pointer-events-none absolute left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] top-[52px] hidden h-px md:block"
              style={{ background: 'linear-gradient(to right, rgba(94,210,156,0.3), rgba(125,211,252,0.3), rgba(167,139,250,0.3))' }}
              aria-hidden="true"
            />

            {steps.map(({ number, title, description, icon, accent, glow, glowCard, tag }) => (
              <TiltCard
                key={number}
                glowColor={glowCard}
                className="motion-item overflow-hidden rounded-2xl border p-6"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.025) 0%, ${glow} 100%)`,
                  borderColor: 'rgba(255,255,255,0.07)',
                }}
              >
                {/* Top row */}
                <div className="mb-6 flex items-start justify-between">
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: accent, letterSpacing: '0.12em' }}
                  >
                    {number}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${glow}`, color: accent, border: `1px solid ${accent}25` }}
                  >
                    {icon}
                  </div>
                </div>

                {/* Tag pill */}
                <span
                  className="mb-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ background: `${accent}18`, color: accent }}
                >
                  {tag}
                </span>

                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/40">{description}</p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
                  aria-hidden="true"
                />
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            REPORT SIGNALS
        ════════════════════════════════════════════════ */}
        <section id="report" className="mx-auto max-w-6xl px-5 pb-20 lg:pb-28">

          <div className="motion-item mb-8">
            <p className="eyebrow mb-3">Live preview</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              What a scan reveals
            </h2>
          </div>

          {/* Signal metric cards */}
          <div className="motion-item grid gap-4 md:grid-cols-3">
            {signals.map(({ label, value, detail, icon, accent, bg, border }) => (
              <TiltCard
                key={label}
                glowColor={`${accent}12`}
                className="overflow-hidden rounded-2xl border p-6"
                style={{ background: bg, borderColor: border }}
              >
                {/* Icon + label */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-white/50">{label}</p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${accent}20`, color: accent }}
                  >
                    {icon}
                  </div>
                </div>

                {/* Big number */}
                <p className="text-5xl font-extrabold tracking-tight" style={{ color: accent }}>
                  {value}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/35">{detail}</p>

                {/* Corner glow orb */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25"
                  style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
                  aria-hidden="true"
                />
              </TiltCard>
            ))}
          </div>

          {/* Petstore report preview */}
          <TiltCard
            glowColor="rgba(255,255,255,0.04)"
            className="motion-item mt-4 overflow-hidden rounded-2xl border"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
          >
            {/* Titlebar */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-xs text-white/25">petstore-api / main</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
              >
                Score: 62 / 100
              </span>
            </div>

            {/* Smell rows */}
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {[
                { severity: 'Critical', title: 'Verb in URL',        detail: 'GET /getUsers is redundant.',           color: '#fb7185', bg: 'rgba(251,113,133,0.05)' },
                { severity: 'Medium',   title: 'No pagination',      detail: '/orders lacks limit and offset params.', color: '#fbbf24', bg: 'rgba(251,191,36,0.05)'  },
                { severity: 'Low',      title: 'Missing versioning',  detail: 'No route versioning strategy detected.', color: '#5ed29c', bg: 'rgba(94,210,156,0.05)'  },
              ].map(({ severity, title, detail, color, bg: rowBg }) => (
                <div
                  key={title}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors duration-150"
                  style={{ background: rowBg }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-[6px] h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <div>
                      <p className="text-sm font-medium text-white/80">{title}</p>
                      <p className="mt-0.5 text-xs text-white/35">{detail}</p>
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: `${color}18`, color }}
                  >
                    {severity}
                  </span>
                </div>
              ))}
            </div>
          </TiltCard>
        </section>

        <ApilensFooter />
      </MotionScope>
    </div>
  );
}
