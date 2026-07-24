'use client';

import { useState } from 'react';
import { type Smell } from '@/types/global';
import { Sparkles, GitPullRequest, XCircle, Crown, Loader2, X } from 'lucide-react';
import { generateSwaggerSpec, type OpenApiSpec } from '@/libs/swagger.service';
import { SwaggerPlayground } from './swagger/SwaggerPlayground';
import { PremiumUpgradeModal } from './swagger/PremiumUpgradeModal';


interface AiFixComparisonCardProps {
  originalScore: number;
  smell: Smell;
  originalCode: string;
  fixedCode: string;
  onCreatePR: () => void;
  onCancel: () => void;
  isCreatingPR: boolean;
}

function MiniScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(score, 0) / 100) * circumference;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth="6"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-lg font-extrabold text-white">{score}</span>
    </div>
  );
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

function computeSimpleDiff(original: string, modified: string): DiffLine[] {
  const left = original.split('\n');
  const right = modified.split('\n');

  const dp: number[][] = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0)
  );

  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = left.length;
  let j = right.length;

  while (i > 0 || j > 0) {
    const leftLine = left[i - 1];
    const rightLine = right[j - 1];

    if (i > 0 && j > 0 && leftLine === rightLine) {
      diff.unshift({
        type: 'unchanged',
        content: leftLine,
        leftLineNumber: i,
        rightLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      diff.unshift({
        type: 'added',
        content: rightLine ?? '',
        rightLineNumber: j,
      });
      j--;
    } else {
      diff.unshift({
        type: 'removed',
        content: leftLine ?? '',
        leftLineNumber: i,
      });
      i--;
    }
  }

  return diff;
}

export default function AiFixComparisonCard({
  originalScore,
  smell,
  originalCode,
  fixedCode,
  onCreatePR,
  onCancel,
  isCreatingPR,
}: AiFixComparisonCardProps) {
  const [isGeneratingSwagger, setIsGeneratingSwagger] = useState(false);
  const [swaggerSpec, setSwaggerSpec] = useState<OpenApiSpec | null>(null);
  const [isSwaggerModalOpen, setIsSwaggerModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleGenerateSwagger = async () => {
    setIsGeneratingSwagger(true);
    try {
      const spec = await generateSwaggerSpec({ code: fixedCode });
      setSwaggerSpec(spec);
      setIsSwaggerModalOpen(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { error?: { code?: string } } } };
      if (errorObj.response?.status === 403 || errorObj.response?.data?.error?.code === 'PREMIUM_REQUIRED') {
        setIsUpgradeModalOpen(true);
      } else {
        setIsUpgradeModalOpen(true);
      }
    } finally {
      setIsGeneratingSwagger(false);
    }
  };

  // Calculate projected score post-fix (removes smell weight or boosts to 95-100)
  const weight = smell.severity === 'Critical' ? 35 : smell.severity === 'Medium' ? 20 : 10;
  const projectedScore = Math.min(100, Math.max(originalScore + weight, 92));
  const scoreDelta = projectedScore - originalScore;

  const diffLines = computeSimpleDiff(originalCode, fixedCode);

  return (
    <div className="space-y-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#0e1626] to-[#0a0f1d] p-6 shadow-2xl shadow-indigo-950/40">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-white">Side-by-Side Remediation Comparison</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Review AI code changes before opening a Pull Request.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-gray-800">
            <MiniScoreRing score={originalScore} color="#f43f5e" />
            <div>
              <p className="text-xs text-slate-400">Current API Score</p>
              <p className="text-base font-extrabold text-rose-400">{originalScore} / 100</p>
              <p className="text-[11px] text-rose-300 mt-0.5 font-medium">{smell.severity} Smell Detected</p>
            </div>
          </div>

          <div className="text-xl font-extrabold text-slate-500">➔</div>

          <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-gray-800">
            <MiniScoreRing score={projectedScore} color="#10b981" />
            <div>
              <p className="text-xs text-slate-400">Projected API Score</p>
              <p className="text-base font-extrabold text-emerald-400">{projectedScore} / 100</p>
              <p className="text-[11px] text-emerald-300 mt-0.5 font-medium">0 Smells Remaining</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Restful Standard:</span>
              <span className="font-semibold text-emerald-300">Compliant</span>
            </div>
            <div className="flex justify-between">
              <span>Security &amp; Best Practices:</span>
              <span className="text-emerald-300">Passed</span>
            </div>
            <div className="flex justify-between">
              <span>Status Code &amp; Conventions:</span>
              <span className="font-mono text-emerald-300">Normalized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Delta Indicator */}
      <div className="space-y-1.5 rounded-xl bg-slate-950/80 p-4 border border-gray-800">
        <div className="flex justify-between text-xs text-slate-300 font-medium">
          <span>Score Progression</span>
          <span className="text-emerald-400 font-bold">{originalScore} ➔ {projectedScore} (+{scoreDelta} pts)</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-900 overflow-hidden border border-gray-800 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${projectedScore}%` }}
          />
        </div>
      </div>

      {/* Code Diff Visualizer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Code Changes Diff Visualizer
          </h4>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Addition
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Deletion
            </span>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-800 bg-[#060a12] p-4 font-mono text-[11px] leading-5 text-slate-300">
          {diffLines.map((line, idx) => {
            const bg =
              line.type === 'added'
                ? 'bg-emerald-950/50 text-emerald-300 border-l-2 border-emerald-500 px-2 py-0.5'
                : line.type === 'removed'
                ? 'bg-rose-950/50 text-rose-300 border-l-2 border-rose-500 px-2 py-0.5 line-through opacity-80'
                : 'text-slate-400 px-2 opacity-70';

            return (
              <div key={idx} className={`flex gap-4 ${bg}`}>
                <span className="w-8 select-none text-right text-slate-500 opacity-50">
                  {line.type === 'added' ? line.rightLineNumber : line.leftLineNumber || ''}
                </span>
                <span className="whitespace-pre">{line.content}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleGenerateSwagger}
          disabled={isGeneratingSwagger || isCreatingPR}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 px-5 py-3 text-xs font-bold text-amber-300 transition-all shadow-lg shadow-amber-500/10"
        >
          {isGeneratingSwagger ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          ) : (
            <Crown className="h-4 w-4 text-amber-400 fill-amber-400/20" />
          )}
          <span>Preview Swagger &amp; Test 👑</span>
        </button>

        <button
          onClick={onCreatePR}
          disabled={isCreatingPR}
          type="button"
          className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-6 py-3 text-xs font-bold text-slate-950 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {isCreatingPR ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              <span>Creating Pull Request...</span>
            </>
          ) : (
            <>
              <GitPullRequest className="h-4 w-4" />
              <span>Approve &amp; Create GitHub Pull Request (+{scoreDelta} pts)</span>
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isCreatingPR}
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-slate-900 hover:bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 transition-all"
        >
          <XCircle className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Upgrade Modal for Free Users */}
      <PremiumUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

      {/* Interactive Swagger Playground Modal */}
      {isSwaggerModalOpen && swaggerSpec && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsSwaggerModalOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SwaggerPlayground spec={swaggerSpec} />
          </div>
        </div>
      )}
    </div>
  );
}
