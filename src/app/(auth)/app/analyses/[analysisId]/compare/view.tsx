'use client';

/**
 * CompareView — AI Fix Comparison Page.
 *
 * Data is passed from Analysis Detail page via sessionStorage:
 *   key: `aifix_compare_${analysisId}`
 *   value: { originalCode, fixedCode, smell, originalScore, smellIndex }
 *
 * Uses GSAP (via MotionScope) for staggered entrance animations.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GitPullRequest,
  RefreshCcw,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  XCircle,
  TrendingUp,
  Code2,
  FileCode,
  GitBranch,
  Crown,
  Loader2,
  X,
} from 'lucide-react';
import { type Smell, type AuthUser } from '@/types/global';
import { createPullRequest } from '@/libs/api';
import { generateSwaggerSpec, type OpenApiSpec } from '@/libs/swagger.service';
import { SwaggerPlayground } from '@/components/swagger/SwaggerPlayground';
import { PremiumUpgradeModal } from '@/components/swagger/PremiumUpgradeModal';
import AppHeader from '@/components/AppHeader';
import MotionScope from '@/components/MotionScope';
import { useToast } from '@/components/RealtimeToast';

// ── Session data shape ──────────────────────────────────────────────
interface CompareSessionData {
  originalCode: string;
  fixedCode: string;
  smell: Smell;
  originalScore: number;
  smellIndex: number;
  analysisId: string;
  repoFullName?: string;
}

// ── Diff helpers ────────────────────────────────────────────────────
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const left = original.split('\n');
  const right = modified.split('\n');

  const dp: number[][] = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0)
  );
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      dp[i]![j] =
        left[i - 1] === right[j - 1]
          ? (dp[i - 1]![j - 1] ?? 0) + 1
          : Math.max(dp[i - 1]![j] ?? 0, dp[i]![j - 1] ?? 0);
    }
  }

  const diff: DiffLine[] = [];
  let i = left.length;
  let j = right.length;
  while (i > 0 || j > 0) {
    const li = left[i - 1];
    const rj = right[j - 1];
    if (i > 0 && j > 0 && li === rj) {
      diff.unshift({ type: 'unchanged', content: li!, leftLineNumber: i, rightLineNumber: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || (dp[i]![j - 1] ?? 0) >= (dp[i - 1]![j] ?? 0))) {
      diff.unshift({ type: 'added', content: rj!, rightLineNumber: j });
      j--;
    } else {
      diff.unshift({ type: 'removed', content: li!, leftLineNumber: i });
      i--;
    }
  }
  return diff;
}

// ── Mini Score Ring ─────────────────────────────────────────────────
function ScoreRing({
  score,
  color,
  label,
  sublabel,
}: {
  score: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(score, 0) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-lg"
          style={{ background: color }}
        />
        <svg className="relative h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="7"
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-extrabold text-white leading-none">{score}</span>
          <span className="text-[10px] text-slate-500 leading-none mt-0.5">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-white">{label}</p>
        {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  valueClass = 'text-white',
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-bold leading-tight ${valueClass} ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────
export default function CompareView({ user }: { user: AuthUser }) {
  const params = useParams<{ analysisId: string }>();
  const router = useRouter();
  const { addToast } = useToast();

  const [data, setData] = useState<CompareSessionData | null>(null);
  const [prState, setPrState] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState('');
  const [prError, setPrError] = useState('');

  // Swagger Playground state
  const [isGeneratingSwagger, setIsGeneratingSwagger] = useState(false);
  const [swaggerSpec, setSwaggerSpec] = useState<OpenApiSpec | null>(null);
  const [isSwaggerModalOpen, setIsSwaggerModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Guard flag — prevents React StrictMode double-execution from
  // reading sessionStorage twice (read → remove → second read returns null → redirect)
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const analysisId = params.analysisId;
    if (!analysisId) return;

    const key = `aifix_compare_${analysisId}`;
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      router.replace(`/app/analyses/${analysisId}`);
      return;
    }

    try {
      const parsed: CompareSessionData = JSON.parse(raw);
      hasLoadedRef.current = true;
      setData(parsed);
      // Keep session data so user can refresh or reopen Swagger modal freely
    } catch {
      router.replace(`/app/analyses/${analysisId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.analysisId]);

  const handleCreatePR = useCallback(async () => {
    if (!data) return;
    setPrState('creating');
    setPrError('');
    try {
      const result = await createPullRequest(data.analysisId, data.smellIndex, data.fixedCode);
      setPrUrl(result.pullRequestUrl);
      setPrState('done');
      addToast({ type: 'success', message: 'Pull Request created!', detail: 'Branch pushed to GitHub.' });
      if (data.analysisId) {
        sessionStorage.removeItem(`aifix_compare_${data.analysisId}`);
      }
    } catch (e) {
      setPrError(e instanceof Error ? e.message : 'Failed to create Pull Request.');
      setPrState('error');
      addToast({ type: 'error', message: 'PR creation failed', detail: e instanceof Error ? e.message : '' });
    }
  }, [data, addToast]);

  const handleDiscard = useCallback(() => {
    if (params.analysisId) {
      sessionStorage.removeItem(`aifix_compare_${params.analysisId}`);
    }
    router.push(`/app/analyses/${params.analysisId}`);
  }, [params.analysisId, router]);

  const handleGenerateSwagger = useCallback(async () => {
    if (!data) return;
    setIsGeneratingSwagger(true);
    try {
      const spec = await generateSwaggerSpec({ code: data.fixedCode });
      setSwaggerSpec(spec);
      setIsSwaggerModalOpen(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { error?: { code?: string } } } };
      if (errorObj.response?.status === 403 || errorObj.response?.data?.error?.code === 'PREMIUM_REQUIRED') {
        setIsUpgradeModalOpen(true);
      } else {
        addToast({ type: 'error', message: 'Swagger generation failed', detail: 'Could not generate Swagger spec.' });
      }
    } finally {
      setIsGeneratingSwagger(false);
    }
  }, [data, addToast]);

  // ── Loading skeleton ──
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#080c14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
          <p className="text-xs text-slate-500">Loading comparison…</p>
        </div>
      </div>
    );
  }

  const projectedScore = Math.min(
    100,
    data.originalScore + (data.smell.severity === 'Critical' ? 35 : data.smell.severity === 'Medium' ? 20 : 10)
  );
  const scoreDelta = projectedScore - data.originalScore;
  const diffLines = computeDiff(data.originalCode, data.fixedCode);
  const addedCount = diffLines.filter((l) => l.type === 'added').length;
  const removedCount = diffLines.filter((l) => l.type === 'removed').length;
  const unchangedCount = diffLines.filter((l) => l.type === 'unchanged').length;
  const totalLines = diffLines.length;

  const severityColor =
    data.smell.severity === 'Critical'
      ? '#f43f5e'
      : data.smell.severity === 'Medium'
      ? '#f59e0b'
      : '#38bdf8';

  return (
    <MotionScope>
      <div
        className="min-h-screen w-full"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f1628 0%, #080c14 60%)' }}
      >
        <AppHeader user={user} />

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8">

          {/* ── Breadcrumb ── */}
          <div className="motion-item mb-6 flex items-center gap-3">
            <button
              onClick={() => router.push(`/app/analyses/${params.analysisId}`)}
              className="group flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2 text-xs font-medium text-slate-400 backdrop-blur-sm transition hover:border-gray-700 hover:bg-gray-800 hover:text-white"
              type="button"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Report
            </button>
            {data.repoFullName && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <GitBranch className="h-3 w-3" />
                <span className="font-mono">{data.repoFullName}</span>
              </div>
            )}
          </div>

          {/* ── Page Header ── */}
          <div className="motion-item mb-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 shadow-lg shadow-indigo-950/40">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  AI Fix Comparison
                </h1>
                <p className="mt-1 max-w-xl text-sm text-slate-400 leading-relaxed">
                  Reviewing fix for{' '}
                  <span
                    className="font-semibold"
                    style={{ color: severityColor }}
                  >
                    {data.smell.smellName}
                  </span>
                  . Inspect the changes, verify the score impact, then approve to open a Pull Request on GitHub.
                </p>
              </div>
            </div>
          </div>

          {/* ── Score Impact Section ── */}
          <section
            className="motion-item mb-5 overflow-hidden rounded-2xl border border-gray-800"
            style={{ background: 'linear-gradient(135deg, #0d1829 0%, #0a0f1d 100%)' }}
          >
            {/* Section label bar */}
            <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-3">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Score Impact Analysis
              </span>
            </div>

            <div className="px-6 py-8">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center sm:gap-12">
                {/* Before */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Before</span>
                  </div>
                  <ScoreRing
                    score={data.originalScore}
                    color={data.originalScore < 50 ? '#f43f5e' : '#f59e0b'}
                    label="Original Score"
                    sublabel="Before AI remediation"
                  />
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300">
                    {data.smell.severity} severity active
                  </span>
                </div>

                {/* Center connector */}
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <div className="h-px w-16 bg-gradient-to-r from-rose-500/40 to-indigo-500/40" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-gradient-to-b from-emerald-500/20 to-teal-600/10 shadow-lg shadow-emerald-950/40">
                      <span className="text-xl font-black text-emerald-400">+{scoreDelta}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">pts gained</span>
                  </div>
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <div className="h-px w-16 bg-gradient-to-r from-indigo-500/40 to-emerald-500/40" />
                  </div>
                </div>

                {/* After */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">After</span>
                  </div>
                  <ScoreRing
                    score={projectedScore}
                    color="#10b981"
                    label="Projected Score"
                    sublabel="After applying AI fix"
                  />
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    All smells resolved
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Score progression</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {data.originalScore} → {projectedScore}
                  </span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-900">
                  {/* Base fill (original) */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 opacity-40"
                    style={{ width: `${data.originalScore}%` }}
                  />
                  {/* Target fill (projected) */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-500 transition-all duration-1000"
                    style={{ width: `${projectedScore}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Stat Grid ── */}
          <div className="motion-item mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={FileCode}
              label="Rule ID"
              value={data.smell.ruleId || 'N/A'}
              valueClass="text-indigo-300"
              mono
            />
            <StatCard
              icon={ShieldAlert}
              label="Severity"
              value={data.smell.severity}
              valueClass={
                data.smell.severity === 'Critical'
                  ? 'text-rose-400'
                  : data.smell.severity === 'Medium'
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }
            />
            <StatCard
              icon={Code2}
              label="Category"
              value={data.smell.category || 'REST Design'}
              valueClass="text-slate-300"
            />
            <StatCard
              icon={GitBranch}
              label="Lines Affected"
              value={`L${data.smell.lineNumbers?.join(', ') || 'N/A'}`}
              valueClass="text-rose-300"
              mono
            />
          </div>

          {/* ── Code Diff Visualizer ── */}
          <section
            className="motion-item mb-5 overflow-hidden rounded-2xl border border-gray-800"
            style={{ background: '#060a12' }}
          >
            {/* Diff header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-slate-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Code Changes Diff
                </h2>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  +{addedCount}
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  -{removedCount}
                </span>
                <span className="text-slate-600">{unchangedCount} unchanged</span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">{totalLines} lines</span>
              </div>
            </div>

            {/* File path bar */}
            {data.smell.endpoints?.[0] && (
              <div className="flex items-center gap-2 border-b border-gray-800/60 bg-gray-950/40 px-5 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span className="font-mono text-[11px] text-slate-500">{data.smell.endpoints[0]}</span>
              </div>
            )}

            {/* Diff lines */}
            <div className="max-h-[480px] overflow-y-auto p-4 font-mono text-[11px] leading-[1.65]">
              {diffLines.map((line, idx) => {
                const styles =
                  line.type === 'added'
                    ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                    : line.type === 'removed'
                    ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 opacity-80'
                    : 'text-slate-500 border-l-2 border-transparent';

                const prefix =
                  line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

                return (
                  <div key={idx} className={`flex gap-3 px-2 ${styles}`}>
                    <span className="w-4 shrink-0 select-none text-center opacity-50">
                      {prefix}
                    </span>
                    <span className="w-7 shrink-0 select-none text-right text-slate-600">
                      {line.type === 'added'
                        ? line.rightLineNumber
                        : line.leftLineNumber || ''}
                    </span>
                    <span className="whitespace-pre">{line.content}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Smell Description ── */}
          {(data.smell.description || data.smell.suggestion) && (
            <section className="motion-item mb-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-5 backdrop-blur-sm">
              <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                AI Remediation Notes
              </h3>
              {data.smell.description && (
                <p className="mb-3 text-sm leading-relaxed text-slate-300">{data.smell.description}</p>
              )}
              {data.smell.suggestion && (
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
                    Suggested approach
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{data.smell.suggestion}</p>
                </div>
              )}
            </section>
          )}

          {/* ── Action Bar ── */}
          {prState === 'done' ? (
            <section className="motion-item rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-teal-950/20 p-10 text-center">
              <div className="flex flex-col items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-3xl shadow-xl shadow-emerald-950/40">
                  🎉
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Pull Request Created!</h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
                    APILens opened a new branch and created a PR on your GitHub repository.
                  </p>
                </div>
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500"
                >
                  <GitPullRequest className="h-4 w-4" />
                  Open Pull Request on GitHub ↗
                </a>
                <button
                  onClick={() => router.push(`/app/analyses/${params.analysisId}`)}
                  className="text-xs text-slate-500 underline transition hover:text-slate-300"
                  type="button"
                >
                  Back to Report
                </button>
              </div>
            </section>
          ) : (
            <div className="motion-item space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCreatePR}
                  disabled={prState === 'creating'}
                  type="button"
                  className="flex flex-1 min-w-[240px] items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prState === 'creating' ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Creating Pull Request…
                    </>
                  ) : (
                    <>
                      <GitPullRequest className="h-4 w-4" />
                      Approve &amp; Create Pull Request
                      <span className="ml-0.5 rounded-md bg-emerald-700/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                        +{scoreDelta} pts
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateSwagger}
                  disabled={isGeneratingSwagger || prState === 'creating'}
                  type="button"
                  className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 px-5 py-3.5 text-sm font-bold text-amber-300 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {isGeneratingSwagger ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  ) : (
                    <Crown className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                  )}
                  Preview Swagger & Test 👑
                </button>

                <button
                  onClick={handleDiscard}
                  disabled={prState === 'creating'}
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/80 px-5 py-3.5 text-sm font-semibold text-slate-400 backdrop-blur-sm transition hover:border-gray-700 hover:bg-gray-800 hover:text-white disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" />
                  Discard
                </button>
              </div>

              {prState === 'error' && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <span className="text-xs text-red-400">{prError}</span>
                  <button
                    onClick={handleCreatePR}
                    className="ml-auto flex shrink-0 items-center gap-1.5 text-xs font-semibold text-red-300 transition hover:text-white"
                    type="button"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> Retry
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-600">
                Approving will create a new branch in{' '}
                <span className="font-mono text-slate-500">{data.repoFullName}</span> and open a
                Pull Request with the AI-generated changes.
              </p>
            </div>
          )}

          {/* Premium Upgrade Modal */}
          <PremiumUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

          {/* Swagger Playground Modal */}
          {isSwaggerModalOpen && swaggerSpec && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl">
                <button
                  onClick={() => setIsSwaggerModalOpen(false)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <SwaggerPlayground spec={swaggerSpec} code={data.fixedCode} />
              </div>
            </div>
          )}
        </main>
      </div>
    </MotionScope>
  );
}
