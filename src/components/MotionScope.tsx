'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { type ReactNode, useRef } from 'react';

gsap.registerPlugin(useGSAP);

export default function MotionScope({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
          okMotion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          if (context.conditions?.reduceMotion) {
            gsap.set('.motion-item', { autoAlpha: 1, y: 0, scale: 1 });
            return;
          }

          const timeline = gsap.timeline({
            defaults: {
              duration: 0.58,
              ease: 'power3.out',
            },
          });

          timeline.from('.motion-item', {
            autoAlpha: 0,
            y: 14,
            scale: 0.985,
            stagger: 0.055,
            clearProps: 'all',
          });
        }
      );

      return () => mm.revert();
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
