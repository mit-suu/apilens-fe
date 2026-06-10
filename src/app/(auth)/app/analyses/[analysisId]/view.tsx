'use client';

import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import { getAnalysis } from '@/libs/api';
import { type Analysis, type AuthUser, type Smell } from '@/types/global';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const severityStyle: Record<
  Smell['severity'],
  { border: string; badge: string; text: string }
> = {
  Critical: {
    border: 'border-l-[#ffb4ab]',
    badge: 'bg-[#93000a] text-[#ffdad6]',
    text: 'text-[#ffb4ab]',
  },
  Medium: {
    border: 'border-l-[#f3dfd2]',
    badge: 'bg-[#353535] text-[#f3dfd2]',
    text: 'text-[#f3dfd2]',
  },
  Low: {
    border: 'border-l-[#8e9194]',
    badge: 'bg-[#353535] text-[#c4c7ca]',
    text: 'text-[#c4c7ca]',
  },
};

const scoreColor = (score: number) => {
  if (score < 50) return '#ffb4ab';
  if (score < 80) return '#ffb400';

  return '#4ade80';
};

const getCategoryValue = (analysis: Analysis, key: string, fallback: number) => {
  const value = analysis.categoryScores?.[key];

  return typeof value === 'number' ? value : fallback;
};

function ScoreRing({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(score, 0) / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          fill="transparent"
          r={radius}
          stroke="#21262d"
          strokeWidth="8"
        />
        <circle
          className="score-ring"
          cx="64"
          cy="64"
          fill="transparent"
          r={radius}
          stroke={scoreColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <span className="absolute text-3xl font-semibold text-white">{score}</span>
    </div>
  );
}

function Radar({ analysis }: { analysis: Analysis }) {
  const naming = getCategoryValue(analysis, 'Naming', 70);
  const http = getCategoryValue(analysis, 'HTTP Design', 65);
  const docs = getCategoryValue(analysis, 'Documentation', 60);
  const security = getCategoryValue(analysis, 'Security', 75);
  const response = getCategoryValue(analysis, 'Response', 68);
  const points = [
    `100,${100 - naming * 0.75}`,
    `${100 + http * 0.75},100`,
    `100,${100 + docs * 0.75}`,
    `${100 - security * 0.75},100`,
  ].join(' ');

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-[#30363d] bg-[#0e0e0e]/30 p-4">
      <svg className="h-full w-full opacity-80" viewBox="0 0 200 200">
        <polygon className="radar-grid" fill="none" points="100,20 180,100 100,180 20,100" />
        <polygon className="radar-grid" fill="none" points="100,40 160,100 100,160 40,100" />
        <polygon className="radar-grid" fill="none" points="100,60 140,100 100,140 60,100" />
        <line className="radar-grid" x1="100" x2="100" y1="20" y2="180" />
        <line className="radar-grid" x1="20" x2="180" y1="100" y2="100" />
        <polygon
          fill="rgba(255,255,255,0.1)"
          points={points}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>
      <span className="absolute top-2 text-xs text-[#8b949e]">NAMING</span>
      <span className="absolute bottom-2 text-xs text-[#8b949e]">DOCS</span>
      <span className="absolute left-2 -rotate-90 text-xs text-[#8b949e]">
        SECURITY
      </span>
      <span className="absolute right-2 rotate-90 text-xs text-[#8b949e]">
        HTTP
      </span>
      <span className="sr-only">Response score {response}</span>
    </div>
  );
}

export default function ResultDashboard({ user }: { user: AuthUser }) {
  const params = useParams<{ analysisId: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.analysisId) return;

    getAnalysis(params.analysisId)
      .then((result) => {
        setAnalysis(result);
        setSelectedIndex(0);
      })
      .catch((caught) => {
        setError(
          caught instanceof Error ? caught.message : 'Unable to load result.'
        );
      });
  }, [params.analysisId]);

  const selectedSmell = useMemo(() => {
    if (!analysis?.smells.length) return null;

    return analysis.smells[selectedIndex] || analysis.smells[0] || null;
  }, [analysis, selectedIndex]);

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[var(--radius-lg)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-5 text-[var(--danger)]">
          <p>{error}</p>
          <Link href="/app" className="mt-4 inline-block underline">
            Back to repo picker
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-[var(--muted)]">
        <div className="glass-panel rounded-[var(--radius-lg)] p-6">
          Loading report...
        </div>
      </div>
    );
  }

  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col">
        <nav className="border-b border-[var(--border)]">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-lg font-semibold tracking-tight">
            APILens
          </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Link className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white" href="/app">
                  Dashboard
                </Link>
                <Link className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white" href="/app/history">
                  History
                </Link>
                <span className="rounded-full border border-[var(--border-strong)] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white">
                  Report
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/app" className="secondary-action">
                New analysis
              </Link>
              <UserBadge user={user} />
            </div>
          </div>
      </nav>

        <main className="mx-auto w-full max-w-7xl flex-grow px-5 py-8">
          <div className="motion-item mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow mb-3">Analysis result</p>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                Endpoint Integrity Report
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {analysis.repoFullName} · {analysis.branch} · {analysis.filePath}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="secondary-action" type="button">
                Export JSON
              </button>
              <Link href="/app" className="primary-action">
                Analyze another repo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="glass-panel motion-item rounded-[var(--radius-lg)] p-5 lg:col-span-4">
              <div className="flex items-center gap-6">
              <ScoreRing score={analysis.score} />
              <div className="flex-grow space-y-2">
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">
                    Endpoints
                  </span>
                    <span className="font-mono text-sm text-[var(--text)]">
                    {analysis.endpointCount}
                  </span>
                </div>
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">
                    Smells
                  </span>
                    <span className="font-mono text-sm text-[var(--text)]">
                    {analysis.smellCount}
                  </span>
                </div>
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">Status</span>
                    <span className="font-mono text-xs text-[var(--text)]">
                      {analysis.status}
                  </span>
                </div>
              </div>
            </div>

              <div className="mt-6">
                <Radar analysis={analysis} />
              </div>

              <div className="mt-6 space-y-3">
                <h2 className="eyebrow">
                Detected Issues
              </h2>
              <div className="issue-scroll max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {analysis.smells.length === 0 ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                      No design smells detected. Your selected file passed the
                      current rule set.
                  </div>
                ) : null}

                {analysis.smells.map((smell, index) => {
                  const style = severityStyle[smell.severity];

                  return (
                    <button
                      key={`${smell.ruleId}-${index}`}
                      aria-pressed={selectedIndex === index}
                      className={`w-full rounded-[var(--radius-md)] border border-l-2 border-[var(--border)] bg-white/[0.035] p-4 text-left transition hover:border-[var(--border-strong)] hover:bg-white/[0.055] ${style.border} ${
                        selectedIndex === index ? 'ring-1 ring-white/20' : ''
                      }`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <span className="text-lg font-medium text-white">
                            {smell.smellName}
                        </span>
                        <span className={`rounded px-1 py-[2px] text-xs ${style.badge}`}>
                          {smell.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-[#c4c7ca]">
                        {smell.endpoints[0] || analysis.filePath}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            </section>

            <section className="motion-item space-y-5 lg:col-span-8">
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#0b1017]">
                <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/[0.035] px-4 py-3">
                  <span className="text-xs uppercase tracking-widest text-[var(--subtle)]">
                  Trace Logs : {analysis.filePath}
                </span>
                <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--danger)]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                </div>
              </div>
              <div className="space-y-1 overflow-x-auto p-4 font-mono text-sm leading-6">
                {analysis.endpoints.slice(0, 12).map((endpoint, index) => {
                  const active = selectedSmell?.endpoints.includes(
                    `${endpoint.method || ''} ${endpoint.path || ''}`.trim()
                  );

                  return (
                    <div
                      key={`${endpoint.method}-${endpoint.path}-${index}`}
                        className={`flex gap-6 rounded px-2 py-0.5 transition ${
                          active
                            ? 'bg-[rgba(251,113,133,0.14)] text-[var(--danger)]'
                            : 'text-[var(--text)] hover:bg-white/[0.035]'
                      }`}
                    >
                        <span className="w-8 select-none text-right text-[var(--subtle)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        {endpoint.method || 'GET'} {endpoint.path || '/'}{' '}
                        <span className="text-[#8b949e]">
                          line {endpoint.lineNumber || '-'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

              <div className="glass-panel relative overflow-hidden rounded-[var(--radius-lg)] p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="eyebrow text-[var(--text)]">
                  AI Remediation Plan
                </h2>
                {selectedSmell ? (
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      severityStyle[selectedSmell.severity].badge
                    }`}
                  >
                    {selectedSmell.severity}
                  </span>
                ) : null}
              </div>
              <div className="space-y-4 text-sm leading-7">
                  <p className="text-[var(--text)]">
                  {selectedSmell?.description ||
                    'APILens did not detect actionable issues in the selected file.'}
                </p>
                  <div className="border-l border-[var(--border)] pl-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-[var(--subtle)]">
                    Suggestion
                  </p>
                    <p className="text-[var(--muted)]">
                    {selectedSmell?.suggestion ||
                      analysis.aiSuggestion ||
                      'No remediation plan is required.'}
                  </p>
                </div>
                {analysis.aiSuggestion ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[#0b1017] p-4 text-[var(--muted)]">
                    {analysis.aiSuggestion}
                  </div>
                ) : null}
              </div>
            </div>
            </section>
        </div>
      </main>
      </div>
    </MotionScope>
  );
}
