"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ value, durationMs = 600 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplay(value);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      prev.current = value;
      return;
    }

    const start = prev.current;
    const delta = value - start;
    if (delta === 0) return;
    const t0 = performance.now();

    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else prev.current = value;
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return <span className="tabular">{display}</span>;
}
