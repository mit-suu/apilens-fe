import { type Smell } from '@/types/global';
import { CheckCircle2, ShieldAlert, Sparkles, GitPullRequest, XCircle } from 'lucide-react';


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
    const leftLine = left[i - 1];
    const dpRow = dp[i];
    const prevDpRow = dp[i - 1];
    if (leftLine === undefined || !dpRow || !prevDpRow) continue;

    for (let j = 1; j <= right.length; j++) {
      const rightLine = right[j - 1];
      if (rightLine === undefined) continue;

      if (leftLine === rightLine) {
        dpRow[j] = (prevDpRow[j - 1] || 0) + 1;
      } else {
        dpRow[j] = Math.max(prevDpRow[j] || 0, dpRow[j - 1] || 0);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = left.length;
  let j = right.length;

  while (i > 0 || j > 0) {
    const leftLine = left[i - 1];
    const rightLine = right[j - 1];

    if (i > 0 && j > 0 && leftLine !== undefined && rightLine !== undefined && leftLine === rightLine) {
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
            <h3 className="text-lg font-bold text-white">AI Remediation Impact Comparison</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparing original REST architecture vs AI-remediated code snippet.
          </p>
        </div>

        {/* Score Boost Pill */}
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
          <span className="text-xs text-slate-400">Score Impact:</span>
          <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
            +{scoreDelta} Pts Boost 🚀
          </span>
        </div>
      </div>

      {/* Side-by-Side Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Before (Original Baseline) */}
        <div className="rounded-xl border border-rose-500/30 bg-[#140f1a]/80 p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-400" /> Original Baseline
            </span>
            <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
              {smell.severity} Smell Active
            </span>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-gray-800">
            <MiniScoreRing score={originalScore} color={originalScore < 50 ? '#f43f5e' : '#f59e0b'} />
            <div>
              <p className="text-xs text-slate-400">Original API Score</p>
              <p className="text-base font-extrabold text-white">{originalScore} / 100</p>
              <p className="text-[11px] text-rose-400/90 mt-0.5 font-medium">Issue: {smell.smellName}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Rule ID:</span>
              <span className="font-mono text-slate-200">{smell.ruleId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="text-slate-200">{smell.category || 'REST Design'}</span>
            </div>
            <div className="flex justify-between">
              <span>Affected Line(s):</span>
              <span className="font-mono text-rose-400">L{smell.lineNumbers?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Card: After (AI Projected Remediation) */}
        <div className="rounded-xl border border-emerald-500/40 bg-[#0f1f1a]/80 p-5 space-y-4 relative overflow-hidden shadow-lg shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Projected Remediation
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              Resolved ✓
            </span>
          </div>

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
              <span>Security & Best Practices:</span>
              <span className="text-emerald-300">Passed</span>
            </div>
            <div className="flex justify-between">
              <span>Status Code & Conventions:</span>
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
              <span>Approve & Create GitHub Pull Request (+{scoreDelta} pts)</span>
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
    </div>
  );
}
