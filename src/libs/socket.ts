/**
 * Singleton WebSocket service for APILens.
 *
 * Usage:
 *   import socketService from '@/libs/socket';
 *   socketService.connect(token);
 *   socketService.on('analysis.created', handler);
 *   socketService.off('analysis.created', handler);
 *   socketService.disconnect();
 */

import { io, type Socket } from 'socket.io-client';

type EventHandler = (...args: unknown[]) => void;

class SocketService {
  private socket: Socket | null = null;
  // Track registered handlers to prevent duplicates: event → Set<handler>
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Connects to the Socket.IO server using the provided JWT.
   */
  connect(token: string): void {
    if (this.socket?.connected) return;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ||
      'http://localhost:5000';

    this.socket = io(socketUrl, {
      // Pass JWT for server-side authentication
      auth: { token },
      // Prefer websocket, fall back to polling
      transports: ['websocket', 'polling'],
      // Socket.IO handles reconnection automatically
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Re-attach all buffered listeners to the newly created socket
    this.listeners.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });

    this.socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WS] Connected successfully:', this.socket?.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WS] Disconnected:', reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WS] Connection error:', error.message);
      }
    });
  }

  /**
   * Disconnects from the server and removes all listeners.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Subscribes to a Socket.IO event.
   * Buffers the listener so it is attached even if called before connect().
   */
  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;

    // Do not register the same handler twice for the same event
    if (handlers.has(handler)) return;

    handlers.add(handler);

    // If socket exists, register immediately
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unsubscribes a specific handler from a Socket.IO event.
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Returns true if the socket is currently connected.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export as singleton — one connection per browser tab
const socketService = new SocketService();
export default socketService;

