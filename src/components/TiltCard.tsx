'use client';

import { useRef, useCallback, ReactNode, CSSProperties } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max tilt degrees, default 6 */
  maxTilt?: number;
  /** Glow color override, e.g. "rgba(94,210,156,0.12)" */
  glowColor?: string;
}

export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 6,
  glowColor = 'rgba(255,255,255,0.07)',
}: TiltCardProps) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>(0);
  const isHovering = useRef(false);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHovering.current) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const card   = cardRef.current;
        const glow   = glowRef.current;
        const border = borderRef.current;
        if (!card || !glow || !border) return;

        const rect    = card.getBoundingClientRect();
        const x       = e.clientX - rect.left;
        const y       = e.clientY - rect.top;
        const cx      = rect.width  / 2;
        const cy      = rect.height / 2;
        const normX   = (x - cx) / cx; // -1 → 1
        const normY   = (y - cy) / cy; // -1 → 1

        const rotY =  normX * maxTilt;
        const rotX = -normY * maxTilt;

        // Tilt + lift
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;

        // Cursor-following radial glow (inner)
        glow.style.opacity    = '1';
        glow.style.background = `radial-gradient(280px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`;

        // Border highlight (brighter near cursor)
        border.style.opacity    = '1';
        border.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgba(255,255,255,0.22), transparent 65%)`;
      });
    },
    [maxTilt, glowColor],
  );

  const onMouseEnter = useCallback(() => {
    isHovering.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHovering.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const card   = cardRef.current;
    const glow   = glowRef.current;
    const border = borderRef.current;
    if (!card || !glow || !border) return;

    // Spring-like reset
    card.style.transform    = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    glow.style.opacity      = '0';
    border.style.opacity    = '0';
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        ...style,
        /* Spring easing: snappy in, smooth out */
        transition: 'transform 240ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Border brightness layer (sits on top of the card border) ── */}
      <div
        ref={borderRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
        style={{
          transition: 'opacity 200ms ease',
          zIndex: 1,
          /* Masks itself to only show the 1px border area */
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
        aria-hidden="true"
      />

      {/* ── Inner cursor-glow layer ── */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
        style={{ transition: 'opacity 300ms ease', zIndex: 0 }}
        aria-hidden="true"
      />

      {/* ── Card content ── */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
