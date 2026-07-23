'use client';

/**
 * RealtimeToast — non-intrusive notification toast for WebSocket events.
 *
 * Shows a brief notification at the bottom-right corner.
 * Auto-dismisses after 4 seconds.
 * Stacks up to 5 toasts at once.
 *
 * Usage:
 *   import { useToast, RealtimeToastContainer } from '@/components/RealtimeToast';
 *
 *   // In your root layout or page:
 *   const { addToast } = useToast();
 *   <RealtimeToastContainer />
 *
 *   // Trigger a toast:
 *   addToast({ message: 'Analysis complete!', type: 'success' });
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';


export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  detail?: string;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 4000;

const toastAccent: Record<ToastType, string> = {
  success: '#4ade80',
  info: '#7dd3fc',
  warning: '#fbbf24',
  error: '#f87171',
};

const toastBg: Record<ToastType, string> = {
  success: 'rgba(74,222,128,0.1)',
  info: 'rgba(125,211,252,0.1)',
  warning: 'rgba(251,191,36,0.1)',
  error: 'rgba(248,113,113,0.1)',
};

const toastIcon: Record<ToastType, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const accent = toastAccent[toast.type];
  const bg = toastBg[toast.type];
  const icon = toastIcon[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: `1px solid ${accent}30`,
        background: bg,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        maxWidth: '320px',
        minWidth: '220px',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      {/* Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: `${accent}20`,
          color: accent,
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </p>
        {toast.detail && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.detail}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-MAX_TOASTS + 1), { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast stack — fixed bottom-right */}
      <div
        aria-label="Realtime notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: toasts.length > 0 ? 'auto' : 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

