/**
 * useRealtimeAnalysis — subscribes to analysis-related Socket.IO events
 * and keeps a local analyses list in sync without page refresh.
 *
 * Events handled:
 *   analysis.created  → prepend to list
 *   analysis.updated  → patch existing entry in-place
 *   analysis.deleted  → remove from list
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { type Analysis } from '@/types/global';

interface AnalysisCreatedPayload {
  analysis: Partial<Analysis> & { _id: string };
  timestamp: string;
}

interface AnalysisUpdatedPayload {
  analysis: Partial<Analysis> & { _id: string };
  timestamp: string;
}

interface AnalysisDeletedPayload {
  analysisId: string;
  timestamp: string;
}

interface UseRealtimeAnalysisOptions {
  /** Called when a new analysis arrives */
  onCreated?: (payload: AnalysisCreatedPayload) => void;
  /** Called when an analysis status/score changes */
  onUpdated?: (payload: AnalysisUpdatedPayload) => void;
  /** Called when an analysis is deleted */
  onDeleted?: (payload: AnalysisDeletedPayload) => void;
  /**
   * If provided, only fire onUpdated when the event matches this ID.
   * Useful on the analysis detail page to watch a single record.
   */
  watchId?: string;
}

export function useRealtimeAnalysis({
  onCreated,
  onUpdated,
  onDeleted,
  watchId,
}: UseRealtimeAnalysisOptions = {}) {
  const { on, off } = useSocket();

  // --- analysis.created ---
  const handleCreated = useCallback(
    (raw: unknown) => {
      const payload = raw as AnalysisCreatedPayload;
      onCreated?.(payload);
    },
    [onCreated]
  );

  // --- analysis.updated ---
  const handleUpdated = useCallback(
    (raw: unknown) => {
      const payload = raw as AnalysisUpdatedPayload;
      // If watching a specific ID, ignore events for other analyses
      if (watchId && payload.analysis._id !== watchId) return;
      onUpdated?.(payload);
    },
    [onUpdated, watchId]
  );

  // --- analysis.deleted ---
  const handleDeleted = useCallback(
    (raw: unknown) => {
      const payload = raw as AnalysisDeletedPayload;
      onDeleted?.(payload);
    },
    [onDeleted]
  );

  useEffect(() => {
    if (onCreated) on('analysis.created', handleCreated);
    if (onUpdated) on('analysis.updated', handleUpdated);
    if (onDeleted) on('analysis.deleted', handleDeleted);

    return () => {
      if (onCreated) off('analysis.created', handleCreated);
      if (onUpdated) off('analysis.updated', handleUpdated);
      if (onDeleted) off('analysis.deleted', handleDeleted);
    };
  }, [on, off, handleCreated, handleUpdated, handleDeleted, onCreated, onUpdated, onDeleted]);
}

/**
 * Utility: merge a partial realtime update into an existing analysis list.
 * Replaces the matching entry with merged data.
 */
export function patchAnalysisList(
  list: Analysis[],
  patch: Partial<Analysis> & { _id: string }
): Analysis[] {
  return list.map((item) =>
    item._id === patch._id ? { ...item, ...patch } : item
  );
}
