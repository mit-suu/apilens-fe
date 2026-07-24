'use client';

/**
 * AiFixModal — Full-screen centered modal wrapping the Side-by-Side
 * AI Fix Comparison Card.
 *
 * Features:
 * - Smooth fade + scale entrance animation (CSS-only, no extra deps)
 * - Scrollable inner body for long diffs
 * - Escape key to dismiss
 * - Click outside backdrop to dismiss
 * - PR created success state displayed inside modal
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { type Smell } from '@/types/global';
import AiFixComparisonCard from './AiFixComparisonCard';

type ModalState = 'diff' | 'creating-pr' | 'pr-created';

interface AiFixModalProps {
  open: boolean;
  state: ModalState;
  originalScore: number;
  smell: Smell;
  originalCode: string;
  fixedCode: string;
  prUrl: string;
  onCreatePR: () => void;
  onClose: () => void;
}

export default function AiFixModal({
  open,
  state,
  originalScore,
  smell,
  originalCode,
  fixedCode,
  prUrl,
  onCreatePR,
  onClose,
}: AiFixModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'creating-pr') onClose();
    },
    [onClose, state]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isCreating = state === 'creating-pr';
  const isPRCreated = state === 'pr-created';

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Fix Comparison"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'modalFadeIn 0.22s ease',
      }}
      onClick={(e) => {
        // Dismiss when clicking the backdrop directly
        if (e.target === e.currentTarget && !isCreating) onClose();
      }}
    >
      {/* Modal Panel */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/60"
        style={{
          background: 'linear-gradient(160deg, #0d1423 0%, #080d18 100%)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm">
              ✨
            </span>
            <div>
              <p className="text-sm font-bold text-white">AI Fix Preview</p>
              <p className="text-xs text-slate-400 leading-tight">{smell.smellName}</p>
            </div>
          </div>

          {!isCreating && (
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 bg-gray-800/80 text-slate-400 transition hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Creating PR Spinner (replaces comparison card) */}
          {isCreating ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-400" />
              <p className="text-sm font-semibold text-white">Creating branch &amp; committing changes…</p>
              <p className="text-xs text-slate-400">Opening Pull Request on GitHub, please wait…</p>
            </div>
          ) : isPRCreated ? (
            /* PR Created Success State */
            <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-4xl shadow-lg shadow-emerald-950/40">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Pull Request Created!</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
                  APILens has successfully created a new branch and opened a Pull Request for your repository.
                </p>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500"
              >
                Open Pull Request on GitHub ↗
              </a>
              <button
                className="text-xs text-slate-500 underline mt-1 hover:text-slate-300 transition"
                onClick={onClose}
                type="button"
              >
                Close &amp; fix another issue
              </button>
            </div>
          ) : (
            /* Main Comparison Card */
            <AiFixComparisonCard
              originalScore={originalScore}
              smell={smell}
              originalCode={originalCode}
              fixedCode={fixedCode}
              onCreatePR={onCreatePR}
              onCancel={onClose}
              isCreatingPR={false}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
