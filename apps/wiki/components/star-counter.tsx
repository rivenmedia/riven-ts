"use client";

import { useEffect, useRef, useState } from "react";

export function StarCounter({ targetCount }: { targetCount: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1500;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * targetCount));
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [targetCount]);

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-muted/50 px-4 py-2 text-sm font-medium"
    >
      <svg
        className="h-4 w-4 text-yellow-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="tabular-nums">{count.toLocaleString()}</span>
      <span className="text-fd-muted-foreground">stars</span>
    </div>
  );
}
