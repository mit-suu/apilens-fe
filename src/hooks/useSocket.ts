/**
 * useSocket — React hook that manages the WebSocket lifecycle.
 *
 * Connects when the component mounts (reads JWT from cookie),
 * disconnects when it unmounts, and exposes on/off helpers
 * that are automatically cleaned up on unmount.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import socketService from '@/libs/socket';
import { getBrowserAuthToken } from '@/libs/auth-token';

type EventHandler = (...args: unknown[]) => void;

export function useSocket() {
  // Track handlers registered during this hook's lifetime for cleanup
  const registeredHandlers = useRef<Array<{ event: string; handler: EventHandler }>>([]);

  useEffect(() => {
    const token = getBrowserAuthToken();

    if (!token) return;

    // Connect (no-op if already connected)
    socketService.connect(token);

    return () => {
      // Unregister only handlers added by this hook instance
      registeredHandlers.current.forEach(({ event, handler }) => {
        socketService.off(event, handler);
      });
      registeredHandlers.current = [];
      // Do NOT disconnect on every unmount — the singleton stays alive
      // across page navigation. Disconnect is only called on logout.
    };
  }, []);

  /**
   * Subscribe to a Socket.IO event.
   * The subscription is automatically removed when the component unmounts.
   */
  const on = useCallback((event: string, handler: EventHandler) => {
    socketService.on(event, handler);
    registeredHandlers.current.push({ event, handler });
  }, []);

  /**
   * Manually unsubscribe from an event before component unmounts.
   */
  const off = useCallback((event: string, handler: EventHandler) => {
    socketService.off(event, handler);
    registeredHandlers.current = registeredHandlers.current.filter(
      (entry) => !(entry.event === event && entry.handler === handler)
    );
  }, []);

  return { on, off, isConnected: () => socketService.isConnected() };
}
