'use client';

import HamsterLoader from '@/components/HamsterLoader';
import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import { createAnalysis, getRepositoryTree } from '@/libs/api';
import { type AuthUser } from '@/types/global';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const progressSteps = [
  'Reading selected branch',
  'Scanning repository tree',
  'Preparing analysis job',
  'Opening live pipeline',
];

const completeStatuses = new Set(['done', 'completed', 'complete', 'success', 'finished']);
const minimumLoadingMs = 3600;

const splitRepo = (fullName: string) => {
  const [owner, repo] = fullName.split('/');

  return { owner: owner || '', repo: repo || '' };
};

export default function StartAnalyzingView({ user }: { user: AuthUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startPromiseRef = useRef<Promise<{ analysisId: string; status: string }> | null>(
    null
  );
  const startKeyRef = useRef('');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const repoFullName = searchParams.get('repoFullName') || '';
  const branch = searchParams.get('branch') || '';
  const queryFilePath = searchParams.get('filePath') || '';
  const queryFileType = searchParams.get('fileType') || '';

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 700);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!repoFullName || !branch) {
      setError('Missing repository or branch information.');
      return;
    }

    let active = true;
    const startKey = `${repoFullName}::${branch}::${queryFilePath}::${queryFileType}`;

    if (startKeyRef.current !== startKey) {
      startKeyRef.current = startKey;
      startPromiseRef.current = null;
    }

    if (!startPromiseRef.current) {
      const startedAt = Date.now();

      startPromiseRef.current = (async () => {
        const { owner, repo } = splitRepo(repoFullName);
        let finalFilePath = queryFilePath;
        let finalFileType = queryFileType;

        if (!finalFilePath || !finalFileType) {
          const treePayload = await getRepositoryTree(owner, repo, branch);
          const firstFile = treePayload.detectedFiles[0];

          if (!firstFile) {
            throw new Error('No analyzable files found on the selected branch.');
          }

          finalFilePath = firstFile.path;
          finalFileType = firstFile.detectedAs;
        }

        const analysis = await createAnalysis({
          repoFullName,
          branch,
          filePath: finalFilePath,
          fileType: finalFileType || undefined,
        });

        const remainingMs = minimumLoadingMs - (Date.now() - startedAt);

        if (remainingMs > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingMs));
        }

        return {
          analysisId: analysis._id,
          status: String(analysis.status).toLowerCase(),
        };
      })();
    }

    startPromiseRef.current
      .then(({ analysisId, status }) => {
        if (!active) return;

        if (completeStatuses.has(status)) {
          router.replace(`/app/analyses/${analysisId}`);
          return;
        }

        router.replace(`/app/analyzing/${analysisId}`);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to start analysis.'
        );
      });

    return () => {
      active = false;
    };
  }, [branch, queryFilePath, queryFileType, repoFullName, router]);

  const activeStep = useMemo(() => Math.min(tick, progressSteps.length - 1), [tick]);

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
            <div className="mb-8 flex w-full flex-col items-center text-center">
              <HamsterLoader className="mb-8 text-[12px] sm:text-[14px]" />
              <p className="eyebrow mb-3">Analysis pipeline</p>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight">
                Starting analysis
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {repoFullName && branch
                  ? `${repoFullName} - ${branch}`
                  : 'Preparing repository context...'}
              </p>
              <p className="mt-2 text-sm text-[var(--subtle)]">
                APILens is scanning the selected branch now.
              </p>
            </div>

            {error ? (
              <div className="w-full rounded-[var(--radius-md)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-4 text-sm text-[var(--danger)]">
                <p>{error}</p>
                <Link
                  className="mt-4 inline-block underline underline-offset-4"
                  href="/app"
                >
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
                    <div
                      key={step}
                      className="relative flex items-start gap-4 py-4"
                    >
                      <div className="z-20 flex h-6 w-6 items-center justify-center bg-[#0d1117]">
                        {done ? (
                          <span className="text-[10px] text-[var(--success)]">
                            OK
                          </span>
                        ) : active ? (
                          <span className="spinner-rotate text-white">O</span>
                        ) : (
                          <span className="text-[var(--border-strong)]">o</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-lg font-medium ${
                            active
                              ? 'pulse-active text-white'
                              : 'text-[var(--muted)]'
                          }`}
                        >
                          {step}
                        </span>
                        <span className="font-mono text-sm text-[var(--subtle)]">
                          {active ? 'Processing...' : done ? 'Complete' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
                  <div className="flex items-center gap-2">
                    <span className="pulse-active h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                      System live
                    </span>
                  </div>
                  <span className="font-mono text-sm text-[var(--text)]">
                    {Math.min(92, 24 + tick * 12)}%
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
