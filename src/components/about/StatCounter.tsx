import { useEffect, useRef, useState } from "react";
import type { GlanceStat } from "../../data/aboutData";

interface StatCounterProps {
  stat: GlanceStat;
  delayMs?: number;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function StatCounter({ stat, delayMs = 0 }: StatCounterProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [display, setDisplay] = useState<string>(stat.displayValue);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!stat.animateCount || hasAnimatedRef.current) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const el = cardRef.current;
    if (!el) return;

    let frameId = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        observer.disconnect();

        const duration = 900;
        const start = performance.now();
        const target = stat.numericValue;

        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic for subtle deceleration
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          setDisplay(`${stat.prefix ?? ""}${formatNumber(current)}${stat.suffix ?? ""}`);

          if (progress < 1) {
            frameId = requestAnimationFrame(tick);
          } else {
            setDisplay(stat.displayValue);
          }
        };

        frameId = requestAnimationFrame(tick);
      },
      { threshold: 0.25 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [stat]);

  return (
    <article
      ref={cardRef}
      className="transition-colors duration-300 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-7 sm:p-8 flex flex-col justify-between hover:border-[#10B981]/35"
    >
      <div>
        <p
          className="text-4xl sm:text-5xl font-bold text-[#10B981] font-mono tracking-tight mb-3"
          aria-label={`${stat.displayValue} ${stat.label}`}
        >
          {display}
        </p>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{stat.label}</h3>
      </div>
      <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">{stat.description}</p>
    </article>
  );
}
