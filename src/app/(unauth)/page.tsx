import MotionScope from '@/components/MotionScope';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'APILens - Quality reports for REST APIs',
  description:
    'Detect REST design smells directly from your GitHub repository in seconds.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
  },
};

const steps = [
  ['01', 'Connect GitHub', 'Authorize once and keep analysis scoped to your repositories.'],
  ['02', 'Choose source', 'Pick a repo, branch, and the API file APILens should inspect.'],
  ['03', 'Review fixes', 'Get a scored report with endpoint-level smells and suggestions.'],
];

const signals = [
  ['Design smells', '8', 'Verb-based URLs, missing versioning'],
  ['Endpoints', '17', 'Express routes and OpenAPI operations'],
  ['Suggested fixes', '4', 'Prioritized remediation notes'],
];

function GithubIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.39-3.9-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.78.12 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.07c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function ReportPreview() {
  return (
    <div className="glass-panel motion-item overflow-hidden rounded-[var(--radius-lg)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-xs text-[var(--subtle)]">petstore-api/main</span>
      </div>
      <div className="grid gap-5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Quality score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-[-0.04em] text-[var(--warning)]">
                62
              </span>
              <span className="text-sm text-[var(--subtle)]">/ 100</span>
            </div>
          </div>
          <span className="status-pill border-[rgba(251,191,36,0.24)] text-[var(--warning)]">
            Needs work
          </span>
        </div>

        <div className="grid gap-2">
          {[
            ['Critical', 'Verb in URL', 'GET /getUsers is redundant.', 'var(--danger)'],
            ['Medium', 'No pagination', '/orders lacks limit and offset.', 'var(--warning)'],
            ['Low', 'Missing versioning', 'No route versioning strategy detected.', 'var(--success)'],
          ].map(([severity, title, detail, color]) => (
            <div
              key={title}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.035] p-3 transition hover:bg-white/[0.055]"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-medium">{title}</span>
                <span className="text-xs" style={{ color }}>
                  {severity}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)]">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <MotionScope>
      <div className="app-shell overflow-hidden">
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(9,13,20,0.78)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              APILens
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {['Overview', 'Workflow', 'Report'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {item}
                </a>
              ))}
            </nav>
            <Link href="/auth/github" className="secondary-action">
             <div className="flex items-center gap-2">
              
              <GithubIcon />
              <span>Continue</span>
             </div>
            </Link>
          </div>
        </header>

        <main>
          <section
            id="overview"
            className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24"
          >
            <div>
              <div className="motion-item mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.04] px-3 py-1 text-sm text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                GitHub-native API governance
              </div>
              <h1 className="motion-item max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-7xl">
                Find REST design issues before they ship.
              </h1>
              <p className="motion-item mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                APILens scans repository files, detects design smells, and turns
                static API structure into a readable quality report for teams.
              </p>
              <div className="motion-item mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/github" className="primary-action">
                 <div className="flex items-center gap-2">
                  <GithubIcon  />
                  Continue with GitHub
                  </div>
                </Link>
                <a href="#workflow" className="secondary-action">
                  See workflow
                </a>
              </div>
              <p className="motion-item mt-4 text-sm text-[var(--subtle)]">
                No credit card. Supports public and private repositories.
              </p>
            </div>
            <ReportPreview />
          </section>

          <section id="workflow" className="mx-auto max-w-6xl px-5 py-16">
            <div className="motion-item mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="eyebrow mb-3">Workflow</p>
                <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                  Three steps from repo to report
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
                The interface progressively reveals decisions, keeping the scan
                flow focused and easy to recover from.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {steps.map(([number, title, description]) => (
                <article
                  key={number}
                  className="quiet-panel motion-item rounded-[var(--radius-lg)] p-5"
                >
                  <span className="font-mono text-xs text-[var(--subtle)]">
                    {number}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section id="report" className="mx-auto max-w-6xl px-5 py-16">
            <div className="glass-panel motion-item rounded-[var(--radius-lg)] p-5 md:p-7">
              <div className="grid gap-4 md:grid-cols-3">
                {signals.map(([label, value, detail]) => (
                  <div key={label} className="rounded-[var(--radius-md)] bg-white/[0.035] p-4">
                    <p className="text-sm text-[var(--muted)]">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                      {value}
                    </p>
                    <p className="mt-2 text-sm text-[var(--subtle)]">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--border)] px-5 py-8">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm text-[var(--subtle)] md:flex-row">
            <span>APILens · Built for developers</span>
            <div className="flex gap-5">
              {['Documentation', 'Status', 'Privacy'].map((item) => (
                <a key={item} href="#" className="transition hover:text-[var(--text)]">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </MotionScope>
  );
}
