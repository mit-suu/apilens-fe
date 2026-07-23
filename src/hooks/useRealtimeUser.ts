/**
 * useRealtimeUser — subscribes to user-related Socket.IO events.
 *
 * Events handled:
 *   user.updated  → patches user state (plan, credits, role)
 *   order.updated → fires when a payment is confirmed
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { type AuthUser } from '@/types/global';

interface UserUpdatedPayload {
  userId: string;
  plan?: AuthUser['plan'];
  role?: AuthUser['role'];
  credits?: number;
  maxCredits?: number;
  planExpiresAt?: string;
  updatedBy?: string;
  timestamp: string;
}

interface OrderUpdatedPayload {
  orderId: string;
  plan: string;
  status: string;
  amount: number;
  paidAt?: string;
  timestamp: string;
}

interface UseRealtimeUserOptions {
  onUserUpdated?: (payload: UserUpdatedPayload) => void;
  onOrderUpdated?: (payload: OrderUpdatedPayload) => void;
}

export function useRealtimeUser({
  onUserUpdated,
  onOrderUpdated,
}: UseRealtimeUserOptions = {}) {
  const { on, off } = useSocket();

  const handleUserUpdated = useCallback(
    (raw: unknown) => {
      onUserUpdated?.(raw as UserUpdatedPayload);
    },
    [onUserUpdated]
  );

  const handleOrderUpdated = useCallback(
    (raw: unknown) => {
      onOrderUpdated?.(raw as OrderUpdatedPayload);
    },
    [onOrderUpdated]
  );

  useEffect(() => {
    if (onUserUpdated) on('user.updated', handleUserUpdated);
    if (onOrderUpdated) on('order.updated', handleOrderUpdated);

    return () => {
      if (onUserUpdated) off('user.updated', handleUserUpdated);
      if (onOrderUpdated) off('order.updated', handleOrderUpdated);
    };
  }, [on, off, handleUserUpdated, handleOrderUpdated, onUserUpdated, onOrderUpdated]);
}
