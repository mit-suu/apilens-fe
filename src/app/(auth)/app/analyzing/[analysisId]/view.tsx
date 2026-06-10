'use client';

import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import { getAnalysis } from '@/libs/api';
import { type Analysis, type AuthUser } from '@/types/global';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const progressSteps = [
  'Fetching file from GitHub',
  'Parsing routes and API definitions',
  'Running rule engine',
  'Generating AI suggestions',
];

export default function AnalyzingView({ user }: { user: AuthUser }) {
  const params = useParams<{ analysisId: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const analysisId = params.analysisId;

  useEffect(() => {
    if (!analysisId) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const result = await getAnalysis(analysisId);

        if (!mounted) return;

        setAnalysis(result);
        setTick((value) => value + 1);

        if (result.status === 'done') {
          router.replace(`/app/analyses/${analysisId}`);
          return;
        }

        if (result.status === 'failed') {
          setError(result.errorMessage || 'Analysis failed.');
          return;
        }

        timeoutId = setTimeout(poll, 2000);
      } catch (caught) {
        if (!mounted) return;

        setError(
          caught instanceof Error ? caught.message : 'Unable to load analysis.'
        );
      }
    };

    poll();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [analysisId, router]);

  const activeStep = useMemo(() => Math.min(tick % 4, 3), [tick]);

  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col overflow-hidden">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between border-b border-[var(--border)] px-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
            APILens
          </Link>
            <div className="h-4 w-px bg-[var(--border)]" />
            <span className="text-xs uppercase tracking-widest text-[var(--subtle)]">
            Console
          </span>
          </div>
          <UserBadge user={user} />
        </nav>

        <main className="relative flex flex-grow items-center justify-center overflow-hidden p-5 md:p-10">
          <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#f2f6fb_0.5px,transparent_0.5px)] [background-size:24px_24px]" />
          <div className="glass-panel motion-item relative z-10 flex w-full max-w-xl flex-col rounded-[var(--radius-lg)] p-6 md:p-8">
            <div className="mb-8 w-full">
              <p className="eyebrow mb-3">Analysis pipeline</p>
              <h1 className="mb-3 text-3xl font-semibold tracking-[-0.035em]">
              Analyzing your API
            </h1>
              <p className="text-sm text-[var(--muted)]">
              {analysis
                ? `${analysis.repoFullName} · ${analysis.branch}`
                : 'Preparing repository context...'}
            </p>
              <p className="mt-2 text-sm text-[var(--subtle)]">
              This usually takes 15-20 seconds.
            </p>
          </div>

          {error ? (
              <div className="w-full rounded-[var(--radius-md)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-4 text-sm text-[var(--danger)]">
              <p>{error}</p>
                <Link className="mt-4 inline-block underline underline-offset-4" href="/app">
                Back to repo picker
              </Link>
            </div>
          ) : (
            <div className="relative flex w-full flex-col">
                <div className="absolute bottom-6 left-[11.5px] top-6 w-px bg-[var(--border)]" />
              {progressSteps.map((step, index) => {
                const done = index < activeStep;
                const active = index === activeStep;

                return (
                  <div key={step} className="relative flex items-start gap-4 py-4">
                    <div className="z-20 flex h-6 w-6 items-center justify-center bg-[#0d1117]">
                      {done ? (
                          <span className="text-[var(--success)]">✓</span>
                      ) : active ? (
                        <span className="spinner-rotate text-white">◌</span>
                      ) : (
                          <span className="text-[var(--border-strong)]">○</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-lg font-medium ${
                            active ? 'pulse-active text-white' : 'text-[var(--muted)]'
                        }`}
                      >
                        {step}
                      </span>
                        <span className="font-mono text-sm text-[var(--subtle)]">
                        {index === 1 && analysis?.endpointCount
                          ? `${analysis.endpointCount} endpoints found`
                          : active
                            ? 'Processing...'
                            : done
                              ? 'Complete'
                              : 'Waiting'}
                      </span>
                    </div>
                  </div>
                );
              })}
                <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-active" />
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                      System live
                    </span>
                  </div>
                  <span className="font-mono text-sm text-[var(--text)]">
                    {Math.min(95, 35 + tick * 18)}%
                  </span>
                </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </MotionScope>
  );
}
